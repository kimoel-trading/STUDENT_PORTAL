<?php
session_start();
header('Content-Type: application/json');

if (!isset($_SESSION['application_started'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'Application not started.']);
    exit();
}

if (!isset($_SESSION['application_progress'])) {
    http_response_code(400);
    echo json_encode(['success' => false, 'message' => 'No application data found.']);
    exit();
}

require_once 'db_connection.php';

try {
    $conn->begin_transaction();

    // Generate unique application number (YY-NNNNNN format)
    $currentYear = date('y');
    $yearPrefix = $currentYear . '-';

    // Find the highest application number for current year
    $query = "SELECT MAX(CAST(SUBSTRING_INDEX(application_number, '-', -1) AS UNSIGNED)) as max_num
              FROM users
              WHERE application_number LIKE ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $yearPrefix . '%');
    $stmt->execute();
    $result = $stmt->get_result();
    $row = $result->fetch_assoc();
    $nextNum = ($row['max_num'] ?? 0) + 1;
    $applicationNumber = $yearPrefix . str_pad($nextNum, 5, '0', STR_PAD_LEFT);

    // Create user record
    $userQuery = "INSERT INTO users (application_number, pin, role, created_at)
                  VALUES (?, '0000', 'applicant', NOW())";
    $userStmt = $conn->prepare($userQuery);
    $userStmt->bind_param('s', $applicationNumber);
    $userStmt->execute();
    $userId = $conn->insert_id;
    $userStmt->close();

    $progress = $_SESSION['application_progress'];

    // 1. Save personal information
    if (isset($progress['personal'])) {
        $personal = $progress['personal'];
        $personalQuery = "INSERT INTO personal (
            user_id, last_name, first_name, middle_name, name_extension,
            sex, birthdate, nationality, height, region, province,
            city_municipality, barangay, house_address, email, mobile_no,
            telephone_no, contact_name, contact_address, contact_mobile,
            contact_relationship, first_member_to_apply, recipient_of_4ps,
            member_of_indigenous_group, member_of_lgbtqia, internally_displaced_person,
            disability, solo_parent, father_name, mother_name, mother_maiden_name,
            father_age, mother_age, father_occupation, mother_occupation,
            father_contact_no, mother_contact_no, family_income_range, siblings_info, student_id_image
        ) VALUES (
            ?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?
        )";

        $personalStmt = $conn->prepare($personalQuery);
        $personalStmt->bind_param(
            'issssssissssssssssssssssssssssisssssssss',
            $userId,
            $personal['last_name'] ?? null,
            $personal['first_name'] ?? null,
            $personal['middle_name'] ?? null,
            $personal['name_extension'] ?? null,
            $personal['sex'] ?? null,
            $personal['birthdate'] ?? null,
            $personal['nationality'] ?? null,
            $personal['height'] ?? null,
            $personal['region'] ?? null,
            $personal['province'] ?? null,
            $personal['city_municipality'] ?? null,
            $personal['barangay'] ?? null,
            $personal['house_address'] ?? null,
            $personal['email'] ?? null,
            $personal['mobile_no'] ?? null,
            $personal['telephone_no'] ?? null,
            $personal['contact_name'] ?? null,
            $personal['contact_address'] ?? null,
            $personal['contact_mobile'] ?? null,
            $personal['contact_relationship'] ?? null,
            $personal['first_member_to_apply'] ?? null,
            $personal['recipient_of_4ps'] ?? null,
            $personal['member_of_indigenous_group'] ?? null,
            $personal['member_of_lgbtqia'] ?? null,
            $personal['internally_displaced_person'] ?? null,
            $personal['disability'] ?? null,
            $personal['solo_parent'] ?? null,
            $personal['father_name'] ?? null,
            $personal['mother_name'] ?? null,
            $personal['mother_maiden_name'] ?? null,
            $personal['father_age'] ?? null,
            $personal['mother_age'] ?? null,
            $personal['father_occupation'] ?? null,
            $personal['mother_occupation'] ?? null,
            $personal['father_contact_no'] ?? null,
            $personal['mother_contact_no'] ?? null,
            $personal['family_income_range'] ?? null,
            $personal['siblings_info'] ?? '[]',
            $personal['student_id_image'] ?? null
        );
        $personalStmt->execute();

        // Save siblings data if provided
        if (isset($personal['has_siblings']) && $personal['has_siblings'] === 'yes') {
            $siblingsArray = json_decode($personal['siblings_info'] ?? '[]', true);
            if (is_array($siblingsArray) && count($siblingsArray) > 0) {
                $siblingQuery = "INSERT INTO siblings (personal_id, full_name, age, educational_attainment, school, year_graduated, `option`)
                                VALUES (?, ?, ?, ?, ?, ?, ?)";
                $siblingStmt = $conn->prepare($siblingQuery);

                foreach ($siblingsArray as $sibling) {
                    $fullName = isset($sibling['fullname']) ? trim($sibling['fullname']) : '';
                    if ($fullName === '') continue;

                    $ageValue = isset($sibling['age']) && $sibling['age'] !== '' ? (int) $sibling['age'] : null;
                    $education = $sibling['education'] ?? '';
                    $school = $sibling['school'] ?? '';
                    $yearGraduated = $sibling['year'] ?? '';
                    $optionValue = $sibling['option'] ?? '';

                    $siblingStmt->bind_param("sisssss", $conn->insert_id, $fullName, $ageValue, $education, $school, $yearGraduated, $optionValue);
                    $siblingStmt->execute();
                }
                $siblingStmt->close();
            }
        }
        $personalStmt->close();
    }

    // 2. Save education information
    if (isset($progress['education'])) {
        $education = $progress['education'];
        $educationQuery = "INSERT INTO education_attachments (
            user_id, shs, shs_email, school_type, track, strand, specialization,
            junior_hs_completion_year, senior_hs_completion_year, category_of_applicant
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";

        $educationStmt = $conn->prepare($educationQuery);
        $educationStmt->bind_param(
            'isssssssss',
            $userId,
            $education['shs'] ?? '',
            $education['shs_email'] ?? '',
            $education['school_type'] ?? '',
            $education['track'] ?? '',
            $education['strand'] ?? '',
            $education['specialization'] ?? '',
            $education['junior_hs_completion_year'] ?? '',
            $education['senior_hs_completion_year'] ?? '',
            $education['category_of_applicant'] ?? ''
        );
        $educationStmt->execute();
        $educationStmt->close();
    }

    // 3. Save program choices
    if (isset($progress['program_choices'])) {
        $choices = $progress['program_choices'];
        $choiceQuery = "INSERT INTO program_choices (user_id, choice_number, program_name, campus_name)
                        VALUES (?, ?, ?, ?)";

        $choiceStmt = $conn->prepare($choiceQuery);
        foreach ($choices as $choice) {
            $choiceStmt->bind_param(
                'iiss',
                $userId,
                $choice['number'],
                $choice['program'],
                $choice['campus']
            );
            $choiceStmt->execute();
        }
        $choiceStmt->close();
    }

    // 4. Save confirmation/academic status
    if (isset($progress['confirmation'])) {
        $confirmation = $progress['confirmation'];
        $confirmationQuery = "INSERT INTO applicants (
            user_id, academic_status, enrolled_in_college, first_time_application,
            transferred_in_high_school, transferred_from, graduate_of_batstateu, graduate_from
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $confirmationStmt = $conn->prepare($confirmationQuery);
        $confirmationStmt->bind_param(
            'isssssss',
            $userId,
            $confirmation['academic_status'],
            $confirmation['enrolled_in_college'],
            $confirmation['first_time_application'],
            $confirmation['transferred_in_high_school'],
            $confirmation['transferred_from'],
            $confirmation['graduate_of_batstateu'],
            $confirmation['graduate_from']
        );
        $confirmationStmt->execute();
        $confirmationStmt->close();
    }

    // 5. Save AAP information
    if (isset($progress['aap'])) {
        $aap = $progress['aap'];
        $aapQuery = "INSERT INTO aap (
            user_id, is_indigent_student, is_als_graduate, is_indigenous_people,
            is_pwd, is_iscolar_ng_bayan, is_children_of_solo_parent, is_batstateu_lab_graduate
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

        $aapStmt = $conn->prepare($aapQuery);
        $aapStmt->bind_param(
            'isssssss',
            $userId,
            $aap['is_indigent_student'],
            $aap['is_als_graduate'],
            $aap['is_indigenous_people'],
            $aap['is_pwd'],
            $aap['is_iscolar_ng_bayan'],
            $aap['is_children_of_solo_parent'],
            $aap['is_batstateu_lab_graduate']
        );
        $aapStmt->execute();
        $aapStmt->close();
    }

    $conn->commit();

    // Clear session data and set final user session
    unset($_SESSION['application_progress']);
    unset($_SESSION['application_started']);
    unset($_SESSION['temp_session_id']);

    $_SESSION['user_id'] = $userId;
    $_SESSION['application_number'] = $applicationNumber;
    $_SESSION['role'] = 'applicant';

    echo json_encode([
        'success' => true,
        'message' => 'Application submitted successfully!',
        'application_number' => $applicationNumber,
        'user_id' => $userId
    ]);

} catch (Exception $e) {
    $conn->rollback();
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Failed to submit application: ' . $e->getMessage()
    ]);
}
?>
