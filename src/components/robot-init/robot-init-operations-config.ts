import React from 'react';
import type { OperationProps } from '../../types/operation';
import { HandEyeCalibrationOperation } from './hand-eye-calibration-operation';
import { JointCalibrationOperation } from './joint-calibration-operation';
import { RobotSwOperation } from './robot-sw-operation';
import { WristAlignmentOperation } from './wrist-alignment-operation';

type OperationComponent = (props: OperationProps) => React.JSX.Element;

export interface RobotInitOperation {
  id: string;
  label: string;
  hideSubTitle?: boolean;
  description?: string;
  steps: RobotInitStep[];
  component: OperationComponent;
}

export interface RobotInitStep {
  id: string;
  label: string;
  description?: string;
  noHistory?: boolean; // APIコールを伴わないステップはHistoryに記録しない
}

export function getRobotInitOperations(includeArm: boolean): RobotInitOperation[] {
  const jointCalibSteps: RobotInitStep[] = [
    ...(includeArm
      ? [
          {
            id: 'jig-install',
            label: 'ジグ取り付け',
            description: 'アームのジョイントキャリブレーションに必要なジグの取り付けを行います。',
            noHistory: true,
          },
        ]
      : []),
    {
      id: 'joint-conn',
      label: '接続確認',
      description:
        'キャリブレーションを始める前に、すべてのジョイントがネットワークに正しく接続されているかを確認します。',
    },
    {
      id: 'joint-run',
      label: '実行',
      description: 'ジョイントキャリブレーションを実行し、各ジョイントの初期位置を取得します。',
    },
    {
      id: 'verify-joint-calibration',
      label: '結果確認',
      description: 'ジョイントキャリブレーションの結果を確認します。',
    },
    ...(includeArm
      ? [
          {
            id: 'jig-removal',
            label: 'ジグ取り外し',
            description: 'キャリブレーションに使用したジグの取り外しを行います。',
            noHistory: true,
          },
        ]
      : []),
  ];

  return [
    {
      id: 'joint-calibration',
      label: 'ジョイントキャリブレーション',
      steps: jointCalibSteps,
      component: JointCalibrationOperation,
    },
    {
      id: 'robot-sw',
      label: '',
      hideSubTitle: true,
      steps: [
        {
          id: 'robot-sw-start',
          label: 'ロボットSW起動',
          description: 'ロボットのソフトウェアを起動し、ロボットの操作を可能にします。',
        },
      ],
      component: RobotSwOperation,
    },
    {
      id: 'hand-eye-calibration',
      label: 'ハンドアイキャリブレーション',
      hideSubTitle: true,
      description:
        'ロボットのカメラとアームの位置関係を補正し、視覚情報とロボット動作を正確に連携させるための調整を行います。',
      steps: [
        { id: 'hand-eye-calibration-left', label: '左カメラ (cam_0)' },
        { id: 'hand-eye-calibration-right', label: '右カメラ (cam_1)' },
      ],
      component: HandEyeCalibrationOperation,
    },
    {
      id: 'wrist-alignment',
      label: '水平アラインメント',
      hideSubTitle: true,
      description: '棚の角度に合わせて手首の姿勢を調整し、カメラ映像を正しい基準にそろえます。',
      steps: [
        { id: 'wrist-snapshot', label: '初期設定', description: '水平アライメントを始めるための基準位置を設定します。' },
        { id: 'wrist-alignment-left', label: '左カメラ (cam_0)' },
        { id: 'wrist-alignment-right', label: '右カメラ (cam_1)' },
      ],
      component: WristAlignmentOperation,
    },
  ];
}
