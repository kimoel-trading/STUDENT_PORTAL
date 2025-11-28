<?php
include('backend/db_connection.php'); // Include the database connection file

// Check the connection
if ($conn) {
    echo "Connected successfully to the database!";
} else {
    echo "Connection failed: " . $conn->connect_error;
}
?>
