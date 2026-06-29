<?php
// Simple contact form handler for Cakir Technics

// 1) Basic spam / method check
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Location: index.html');
    exit;
}

// 2) Collect and sanitize fields
$first_name = isset($_POST['first_name']) ? trim($_POST['first_name']) : '';
$last_name  = isset($_POST['last_name'])  ? trim($_POST['last_name'])  : '';
$email      = isset($_POST['email'])      ? trim($_POST['email'])      : '';
$message    = isset($_POST['message'])    ? trim($_POST['message'])    : '';

if ($first_name === '' || $last_name === '' || $email === '' || $message === '') {
    // Missing data, go back
    header('Location: index.html');
    exit;
}

// 3) Prepare email
$to      = 'ozcancakir@it-solutions-cakir.be';
$subject = 'Website contact form - Cakir Technics';
$body    = "New contact form submission:\n\n" .
           "Name: {$first_name} {$last_name}\n" .
           "Email: {$email}\n\n" .
           "Message:\n{$message}\n";

$headers = "From: no-reply@it-solutions-cakir.be\r\n" .
           "Reply-To: {$email}\r\n" .
           "X-Mailer: PHP/" . phpversion();

// 4) Send email
$sent = mail($to, $subject, $body, $headers);

// 5) Simple thank-you page
?>
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Thank you | Cakir Technics</title>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="stylesheet" href="./style.css">
</head>
<body>
  <main class="section-padding">
    <div class="container">
      <h2 class="section-title">Thank you</h2>
      <p class="contact-subtitle">
        <?php if ($sent): ?>
          Your message has been sent to our operations team. 
          We will get back to you as soon as possible.
        <?php else: ?>
          There was a problem sending your message. 
          Please try again later or contact us by phone or WhatsApp.
        <?php endif; ?>
      </p>
      <p style="text-align:center; margin-top:24px;">
        <a href="./" class="btn btn-outline">Back to homepage</a>
      </p>
    </div>
  </main>
</body>
</html>
