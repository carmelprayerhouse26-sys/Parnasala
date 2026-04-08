<?php
/**
 * Parnasala Fellowship - Email Sender Endpoint
 * 
 * Host this file on your PHP server (like Hostinger, cPanel)
 * and update your Flask environment with PHP_MAILER_URL and PHP_MAILER_SECRET.
 */

header('Content-Type: application/json');

// Only allow POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed. Use POST.']);
    exit;
}

// Get POST data
$to = isset($_POST['to']) ? trim($_POST['to']) : '';
$subject = isset($_POST['subject']) ? trim($_POST['subject']) : '';
$body = isset($_POST['body']) ? trim($_POST['body']) : '';
$secret = isset($_POST['secret']) ? trim($_POST['secret']) : '';

// -------------------------------------------------------------------
// SECURITY TOKEN Configuration
// Change this to a random secret password, and set the same
// password in your Flask .env file as PHP_MAILER_SECRET
// -------------------------------------------------------------------
$expected_secret = 'Parnasala@SecureEmailToken2026'; 

if ($secret !== $expected_secret) {
    http_response_code(401);
    echo json_encode(['error' => 'Unauthorized. Invalid secret token.']);
    exit;
}

if (empty($to) || empty($subject) || empty($body)) {
    http_response_code(400);
    echo json_encode(['error' => 'Missing required fields: to, subject, or body']);
    exit;
}

// Set up HTML email headers
$headers = "MIME-Version: 1.0" . "\r\n";
$headers .= "Content-type:text/html;charset=UTF-8" . "\r\n";
// Change the From email to your actual domain email
$headers .= "From: no-reply@parnasalafellowship.com" . "\r\n";

// Send email using PHP's native mail function
if (mail($to, $subject, $body, $headers)) {
    echo json_encode(['success' => true, 'message' => 'Email sent successfully.']);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'Failed to send email. Check your PHP server mail configuration.']);
}
?>
