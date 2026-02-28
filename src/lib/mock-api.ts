/** Simulated API calls with artificial delay */
const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

export const mockApi = {
  async scanJointInitiate(_robotId: string) {
    await delay(1500);
    return { value: 'cmd-001' };
  },
  async scanJointConfirm(_cmdId: string) {
    await delay(800);
    return true;
  },
  async calibrateJointInitiate(_robotId: string) {
    await delay(2000);
    return { value: 'cmd-002' };
  },
  async calibrateJointConfirm(_cmdId: string) {
    await delay(1200);
    return true;
  },
  async verifyJointCalibrationInitiate(_robotId: string) {
    await delay(1500);
    return { value: 'cmd-003' };
  },
  async verifyJointCalibrationConfirm(_cmdId: string) {
    await delay(1000);
    return true;
  },
  async startRobotInitiate(_robotId: string) {
    await delay(2000);
    return true;
  },
  async startRobotConfirm(_robotId: string) {
    await delay(1000);
    return true;
  },
  async calibrateCameraInitiate(_robotId: string, _camera: string) {
    await delay(2000);
    return true;
  },
  async calibrateCameraConfirm(_robotId: string, _camera: string) {
    await delay(1000);
    return true;
  },
  async wristSnapshotInitiate(_robotId: string) {
    await delay(1500);
    return { value: 'cmd-snap' };
  },
  async wristSnapshotConfirm(_cmdId: string) {
    await delay(800);
    return true;
  },
  async wristAlignmentInitiate(_robotId: string, _orientation: unknown) {
    await delay(400);
    return { status: 200, errors: [] };
  },
  async wristAlignmentConfirm(_robotId: string) {
    await delay(300);
    return { status: 200, errors: [] };
  },
  async saveWristAlignmentInitiate(_robotId: string) {
    await delay(1500);
    return { value: 'cmd-save' };
  },
  async saveWristAlignmentConfirm(_cmdId: string) {
    await delay(800);
    return true;
  },
  async moveRailPositionInitiate(_robotId: string, _vector: unknown) {
    await delay(500);
    return true;
  },
  async moveRailPositionConfirm(_robotId: string) {
    await delay(1000);
    return true;
  },
};
