# Robot Init Prototype

A frontend prototype for the Robot Initialization flow, built by design for reference during implementation.

> **Note:** This is a design prototype, not production code. It is intended to communicate UI intent and interaction patterns. Feel free to use it as a reference — you don't have to follow the code structure as-is.

## Purpose

This prototype covers the full Robot Init process (Joint Calibration → Robot SW Start → Hand-Eye Calibration → Wrist Alignment) along with a status panel that displays live robot state during the process.

## Getting Started

```bash
npm install
npm run dev
```

## Key Components

| Component | Description |
|-----------|-------------|
| `src/components/robot-init/robot-init.tsx` | Main Robot Init flow with step/operation management |
| `src/components/robot-init/robot-init-operations-config.ts` | Configuration for all operations and steps |
| `src/components/BreathingPanel.tsx` | Status panel shown alongside the init flow |
| `src/App.tsx` | Root — wires together the init flow and status panel |

## Status Panel

The status panel (`BreathingPanel`) is designed to show only data that can be fetched from the server at any time (stateless). The following information is displayed:

| Info | States | Data source |
|------|--------|-------------|
| Camera feed | Online / Offline | `GET /camera-snapshot` |
| Robot connection status | Online / Offline | `GET /telemetry` → `RobotStatus` |
| Last updated time | timestamp / — | `GET /telemetry` → `last_updated_at` |
| `HumanDetectionEnabled` | true / false | `RobotLiveData` |
| `HumanDetected` | true / false | `GetHumanDetectionMessage()` → `human_presence_hist` |
| `ObstacleDetected` | true / false | `GetHumanDetectionMessage()` → `obstacle_present` |
| `FallenDrinkDetected` | true / false | `GetHumanDetectionMessage()` → `fallen_drink_present` |

## Mock API

All API calls are mocked in `src/lib/mock-api.ts` with artificial delays to simulate real async behavior. In production, these would map to the actual backend endpoints (initiate → confirm pattern).
