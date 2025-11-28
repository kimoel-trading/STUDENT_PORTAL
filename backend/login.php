<?php
session_start(); // Start the session to store user data
include('db_connection.php'); // Include the database connection file

// Check if form is submitted via POST method
if ($_SERVER["REQUEST_METHOD"] == "POST") {
    // Get form data (application number and PIN)
    $application_number = $_POST['application_number'];
    $pin = $_POST['pin'];

    // Prepare and execute SQL query to fetch user data based on application number
    $query = "SELECT * FROM users WHERE application_number = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param('s', $application_number);
    $stmt->execute();
    $result = $stmt->get_result();

    // Check if the user exists in the database
    if ($result->num_rows > 0) {
        // Fetch user data
        $user = $result->fetch_assoc();
        
        // Check if the entered PIN matches the stored PIN
        if ($pin == $user['pin']) {
            // Correct PIN, set session variables and redirect to Data Privacy Notice page
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['application_number'] = $user['application_number'];
            $_SESSION['role'] = $user['role'];

            // Redirect to the Data Privacy Notice page first, with a success flag
            header("Location: ../college-admission-portal/privacy.html?login=success");
            exit();
        } else {
            // Incorrect PIN, stay on the login page and show error message
            header("Location: ../college-admission-portal/landing.php?error=Account+not+found+or+incorrect+PIN");
            exit();
        }
    } else {
        // User not found, stay on the login page and show error message
        header("Location: ../college-admission-portal/landing.php?error=Account+not+found+or+incorrect+PIN");
        exit();
    }
}
?>
