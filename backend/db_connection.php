<?php
$servername = "localhost"; // The host name (for local server, it's localhost)
$username = "root"; // Your MySQL username (for XAMPP, it's usually 'root')
$password = ""; // Your MySQL password (for XAMPP, it's usually an empty string)
$dbname = "student account"; // Name of your database (as created in phpMyAdmin)

// Create connection
$conn = new mysqli($servername, $username, $password, $dbname);

// Check connection
if ($conn->connect_error) {
    die("Connection failed: " . $conn->connect_error);
}
?>
