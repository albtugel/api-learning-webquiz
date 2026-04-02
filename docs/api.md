# WebQuiz API (JSON Server)

Base URL: `http://localhost:8888`

## Quizzes

### Get all quizzes

- Method: `GET`
- Path: `/quizzes`
- Response: `200 OK`

Example response:

```json
[
  {
    "id": "q1",
    "title": "HTML Basics",
    "text": "Which tag is used to create a hyperlink?",
    "options": ["<a>", "<p>", "<div>", "<span>"],
    "answer": [0]
  }
]
```

### Create a quiz

- Method: `POST`
- Path: `/quizzes`
- Body:

```json
{
  "title": "CSS Basics",
  "text": "Which property changes text color?",
  "options": ["font-weight", "color", "margin", "display"],
  "answer": [1]
}
```

### Delete a quiz

- Method: `DELETE`
- Path: `/quizzes/:id`

## Completed Attempts

### Get all attempts

- Method: `GET`
- Path: `/completed`

### Create an attempt

- Method: `POST`
- Path: `/completed`
- Body:

```json
{
  "quizId": "q1",
  "user": "user-123@webquiz.local",
  "date": "2026-04-02T08:00:00.000Z",
  "isCorrect": true,
  "answer": 0
}
```

## Users

### Create a user

- Method: `POST`
- Path: `/users`
- Body:

```json
{
  "email": "user-123@webquiz.local",
  "password": "secret123"
}
```

## Notes

- JSON Server generates `id` automatically if not provided.
- The frontend uses the same endpoints and will fall back to local storage if the API is offline.
