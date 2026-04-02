<?php
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS, DELETE');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$method = $_SERVER['REQUEST_METHOD'];
$requestUri = $_SERVER['REQUEST_URI'];

$mockQuiz = [
    'id' => 1,
    'title' => 'PHP Mock Quiz',
    'text' => 'Is the PHP mock server running?',
    'options' => ['Yes', 'No', 'Not sure', 'It failed'],
    'answer' => [0]
];

if (strpos($requestUri, '/quizzes') !== false) {
    if ($method === 'GET') {
        echo json_encode([$mockQuiz]);
        exit;
    }

    if ($method === 'POST') {
        echo json_encode(['status' => 'success', 'message' => 'Quiz created via PHP mock']);
        exit;
    }
}

if (strpos($requestUri, '/completed') !== false && $method === 'POST') {
    echo json_encode(['status' => 'success', 'message' => 'Answer stored via PHP mock']);
    exit;
}

if (strpos($requestUri, '/users') !== false && $method === 'POST') {
    echo json_encode(['status' => 'success', 'message' => 'User created via PHP mock']);
    exit;
}

echo json_encode(['message' => 'WebQuiz PHP mock is running']);
