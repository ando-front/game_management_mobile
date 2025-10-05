# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a mobile application for managing children's game time based on task completion. Children earn game time by completing tasks (homework, chores) set by parents.

**Target Platforms**: iPad, iPhone, Android, Web (PC)
**Tech Stack** (planned): Firebase (Auth, Firestore, Cloud Functions)
**Future Enhancement**: Voice assistant integration (Alexa/Google Assistant)

## User Roles

- **Child**: Complete tasks, check remaining game time, start/stop game sessions, view usage history
- **Parent**: Register tasks with rewards, approve task completion, manage game time allocation, support multiple children

## Data Structure (Firestore)

### users
```json
{
  "uid": "xxxxx",
  "role": "parent | child",
  "name": "たろう",
  "gameMinutes": 45
}
```

### tasks
```json
{
  "taskId": "abc123",
  "userId": "xxxxx",
  "title": "宿題(算数)",
  "expectedMinutes": 30,
  "rewardMinutes": 10,
  "status": "pending | done | approved"
}
```

### usage_logs
```json
{
  "userId": "xxxxx",
  "start": "2025-10-05T17:00:00Z",
  "end": "2025-10-05T17:20:00Z",
  "duration": 20
}
```

## Security & Authentication

- Firebase Authentication for user login (Google/Email)
- Role-based access control (parent/child permissions)
- Server-side time validation to prevent tampering
- Authenticated access only to all data operations

## Architecture Notes

- Real-time data synchronization using Firestore
- Cloud Functions for business logic (task approval, time calculations, validation)
- Child UI should be intuitive with large touch-friendly components
- Parent UI includes task management and time administration features
- Time reward ratios are configurable by parents (e.g., 30min homework = 10min game time)

## Development Language

Project documentation is in Japanese. Code comments and user-facing text should be in Japanese unless otherwise specified.
