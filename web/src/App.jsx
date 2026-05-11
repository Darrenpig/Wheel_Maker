import { useState, useMemo } from 'react';
import { Swerve_Get_Preset } from './core/Swerve_Get_Preset';
import { Swerve_Evaluate_Case } from './core/Swerve_Evaluate_Case';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine } from 'recharts';
import { Activity, Settings, Zap, RotateCcw, Target, Gauge, Cpu } from 'lucide-react';
import './App.css';

const MOTOR_PRESETS_DB = {
  '自定义': null,
  'M3508 - DJI 大疆': {
    motor_rated_torque: 3.0,
    motor_peak_torque: 4.5,
    motor_rated_current: 10,
    motor_peak_current: 15,
    motor_kv: 469,
    motor_rated_power: 150,
    motor_rated_rpm: 477,
  },
  '8010 - Unitree 宇树': {
    motor_rated_torque: 3.7,
    motor_peak_torque: 23.7,
    motor_rated_current: 15,
    motor_peak_current: 96,
    motor_kv: 100,
    motor_rated_power: 720,
    motor_rated_rpm: 1858,
  },
  'DM3519 - Dongbu 东步': {
    motor_rated_torque: 3.5,
    motor_peak_torque: 7.8,
    motor_rated_current: 12,
    motor_peak_current: 27,
    motor_kv: 120,
    motor_rated_power: 288,
    motor_rated_rpm: 786,
  },
  'AK10-9 - CubeMars': {
    motor_rated_torque: 18.0,
    motor_peak_torque: 45.0,
    motor_rated_current: 20,
    motor_peak_current: 50,
    motor_kv: 100,
    motor_rated_power: 960,
    motor_rated_rpm: 509,
  },
  'M1505 - T-Motor': {
    motor_rated_torque: 0.5,
    motor_peak_torque: 1.5,
    motor_rated_current: 6,
    motor_peak_current: 18,
    motor_kv: 150,
    motor_rated_power: 144,
    motor_rated_rpm: 2750,
  },
  'T30 - DJI 大疆': {
    motor_rated_torque: 14.0,
    motor_peak_torque: 35.0,
    motor_rated_current: 60,
    motor_peak_current: 150,
    motor_kv: 100,
    motor_rated_power: 3600,
    motor_rated_rpm: 2455,
  },
  'U8 - T-Motor (航模/直驱)': {
    motor_rated_torque: 1.5,
    motor_peak_torque: 3.0,
    motor_rated_current: 12,
    motor_peak_current: 24,
    motor_kv: 110,
    motor_rated_power: 288,
    motor_rated_rpm: 1833,
  },
  'M2006 - DJI 大疆': {
    motor_rated_torque: 0.3,
    motor_peak_torque: 1.0,
    motor_rated_current: 3,
    motor_peak_current: 10,
    motor_kv: 500,
    motor_rated_power: 72,
    motor_rated_rpm: 2292,
  },
  'GM6020 - DJI 大疆': {
    motor_rated_torque: 1.24,
    motor_peak_torque: 3.8,
    motor_rated_current: 3,
    motor_peak_current: 9,
    motor_kv: 100,
    motor_rated_power: 72,
    motor_rated_rpm: 554,
  },
  'DM4310 - 达妙': {
    motor_rated_torque: 1.5,
    motor_peak_torque: 4.0,
    motor_rated_current: 10,
    motor_peak_current: 27,
    motor_kv: 120,
    motor_rated_power: 240,
    motor_rated_rpm: 1528,
  },
  'Go1/A1 - Unitree 宇树': {
    motor_rated_torque: 2.0,
    motor_peak_torque: 23.0,
    motor_rated_current: 12,
    motor_peak_current: 138,
    motor_kv: 120,
    motor_rated_power: 288,
    motor_rated_rpm: 1375,
  }
};

const TireDeformationChart = ({ radius, maxDelta, contactHalfLen, wheelName }) => {
  const visualScale = 25;
  const R = radius;
  const deltaActual = maxDelta;
  let deltaVisual = deltaActual * visualScale;
  deltaVisual = Math.min(deltaVisual, 0.65 * R);
  const contactVisual = Math.sqrt(Math.max(0, 2 * R * deltaVisual - deltaVisual * deltaVisual));

  const minX = -1.35 * R * 1000;
  const minY = -2.35 * R * 1000;
  const width = 2.7 * R * 1000;
  const height = 2.47 * R * 1000;

  return (
    <svg viewBox={`${minX} ${minY} ${width} ${height}`} className="w-full h-full">
      <defs>
        <clipPath id="ground-clip">
          <rect x={-2 * R * 1000} y={0} width={4 * R * 1000} height={3 * R * 1000} />
        </clipPath>
      </defs>
      <g transform="scale(1, -1)">
        {/* Undeformed circle */}
        <circle cx={0} cy={R * 1000} r={R * 1000} fill="none" stroke="#9ca3af" strokeWidth="2" strokeDasharray="4 4" />
        
        {/* Deformed circle clipped by ground */}
        <circle cx={0} cy={(R - deltaVisual) * 1000} r={R * 1000} fill="none" stroke="#ea580c" strokeWidth="2" clipPath="url(#ground-clip)" />
        
        {/* Ground line */}
        <line x1={-1.25 * R * 1000} y1={0} x2={1.25 * R * 1000} y2={0} stroke="#1f2937" strokeWidth="1.5" />
        
        {/* Contact line */}
        <line x1={-contactVisual * 1000} y1={0} x2={contactVisual * 1000} y2={0} stroke="#8b5cf6" strokeWidth="5" />
        
        {/* Center dot */}
        <circle cx={0} cy={(R - deltaVisual) * 1000} r={2} fill="#ea580c" />
      </g>
      
      {/* Text overlay (unflipped Y) */}
      <text x={-1.22 * R * 1000} y={-2.05 * R * 1000} fontSize="12" fill="#4b5563">
        <tspan x={-1.22 * R * 1000} dy="0">显示轮: {wheelName}</tspan>
        <tspan x={-1.22 * R * 1000} dy="16">实际下压: {(deltaActual * 1000).toFixed(5)} mm</tspan>
        <tspan x={-1.22 * R * 1000} dy="16">接触半长: {(contactHalfLen * 1000).toFixed(5)} mm</tspan>
        <tspan x={-1.22 * R * 1000} dy="16">示意放大: x{visualScale}</tspan>
      </text>
    </svg>
  );
};

function App() {
  const [preset, setPreset] = useState('Swerve 四轮舵轮 - 默认');
  const [motorPresetKey, setMotorPresetKey] = useState('自定义');
  const [inputs, setInputs] = useState({
    vx: 0,
    vy: 0,
    omega_z: 0,
    dt: 0.02,
    ax: 0,
    ay: 0,
  });

  const [motorParams, setMotorParams] = useState({
    swerve_m_total: 25.0,
    swerve_wheel_base_x: 270.0,
    swerve_wheel_base_y: 270.0,
    swerve_wheel_radius: 42.5,
    swerve_wheel_width: 30.0,
    swerve_h_cog: 200.0,
    swerve_I_steer: 0.015,
    
    swerve_i_drive: 1.0,
    swerve_i_steer: 1.0,
    swerve_motor_max_rpm: 450,
    swerve_steer_max_rpm: 120,
    
    motor_rated_power: 250,
    motor_kv: 100,
    motor_rated_torque: 1.2,
    motor_peak_torque: 3.5,
    motor_rated_rpm: 3000,
    motor_rated_current: 10,
    motor_peak_current: 30,

    swerve_mu_ground: 0.8,
    swerve_carpet_factor: 4.0,
    swerve_roll_resistance: 0.018,
    swerve_eta_slip: 0.9,
    swerve_hardness_shoreA: 60,
    swerve_T_mech_drive: 0.1,
    swerve_T_mech_steer: 0.1,
    swerve_redundancy: 1.2,
  });

  // 当切换预设时，同步更新电机参数输入框的默认值
  const basePresetParams = useMemo(() => Swerve_Get_Preset(preset), [preset]);
  
  // 初始化或切换预设时同步电机参数
  useMemo(() => {
    // eslint-disable-next-line react-hooks/set-state-in-render
    setMotorParams({
      swerve_m_total: basePresetParams.swerve_m_total,
      swerve_wheel_base_x: basePresetParams.swerve_wheel_base_x,
      swerve_wheel_base_y: basePresetParams.swerve_wheel_base_y,
      swerve_wheel_radius: basePresetParams.swerve_wheel_radius,
      swerve_wheel_width: basePresetParams.swerve_wheel_width,
      swerve_h_cog: basePresetParams.swerve_h_cog,
      swerve_I_steer: basePresetParams.swerve_I_steer,

      swerve_i_drive: basePresetParams.swerve_i_drive,
      swerve_i_steer: basePresetParams.swerve_i_steer,
      swerve_motor_max_rpm: basePresetParams.swerve_motor_max_rpm,
      swerve_steer_max_rpm: basePresetParams.swerve_steer_max_rpm,
      motor_rated_power: basePresetParams.motor_rated_power,
      motor_kv: basePresetParams.motor_kv,
      motor_rated_torque: basePresetParams.motor_rated_torque,
      motor_peak_torque: basePresetParams.motor_peak_torque,
      motor_rated_rpm: basePresetParams.motor_rated_rpm,
      motor_rated_current: basePresetParams.motor_rated_current,
      motor_peak_current: basePresetParams.motor_peak_current,

      swerve_mu_ground: basePresetParams.swerve_mu_ground,
      swerve_carpet_factor: basePresetParams.swerve_carpet_factor,
      swerve_roll_resistance: basePresetParams.swerve_roll_resistance,
      swerve_eta_slip: basePresetParams.swerve_eta_slip,
      swerve_hardness_shoreA: basePresetParams.swerve_hardness_shoreA,
      swerve_T_mech_drive: basePresetParams.swerve_T_mech_drive,
      swerve_T_mech_steer: basePresetParams.swerve_T_mech_steer,
      swerve_redundancy: basePresetParams.swerve_redundancy,
    });
    // eslint-disable-next-line react-hooks/set-state-in-render
    setMotorPresetKey('自定义');
  }, [basePresetParams]);

  // 合并预设参数和用户手动修改的电机参数
  const p = useMemo(() => {
    return {
      ...basePresetParams,
      swerve_m_total: parseFloat(motorParams.swerve_m_total) || basePresetParams.swerve_m_total,
      swerve_wheel_base_x: parseFloat(motorParams.swerve_wheel_base_x) || basePresetParams.swerve_wheel_base_x,
      swerve_wheel_base_y: parseFloat(motorParams.swerve_wheel_base_y) || basePresetParams.swerve_wheel_base_y,
      swerve_wheel_radius: parseFloat(motorParams.swerve_wheel_radius) || basePresetParams.swerve_wheel_radius,
      swerve_wheel_width: parseFloat(motorParams.swerve_wheel_width) || basePresetParams.swerve_wheel_width,
      swerve_h_cog: parseFloat(motorParams.swerve_h_cog) || basePresetParams.swerve_h_cog,
      swerve_I_steer: parseFloat(motorParams.swerve_I_steer) || basePresetParams.swerve_I_steer,

      swerve_i_drive: parseFloat(motorParams.swerve_i_drive) || basePresetParams.swerve_i_drive,
      swerve_i_steer: parseFloat(motorParams.swerve_i_steer) || basePresetParams.swerve_i_steer,
      swerve_motor_max_rpm: parseFloat(motorParams.swerve_motor_max_rpm) || basePresetParams.swerve_motor_max_rpm,
      swerve_steer_max_rpm: parseFloat(motorParams.swerve_steer_max_rpm) || basePresetParams.swerve_steer_max_rpm,
      motor_rated_power: parseFloat(motorParams.motor_rated_power) || basePresetParams.motor_rated_power,
      motor_kv: parseFloat(motorParams.motor_kv) || basePresetParams.motor_kv,
      motor_rated_torque: parseFloat(motorParams.motor_rated_torque) || basePresetParams.motor_rated_torque,
      motor_peak_torque: parseFloat(motorParams.motor_peak_torque) || basePresetParams.motor_peak_torque,
      motor_rated_rpm: parseFloat(motorParams.motor_rated_rpm) || basePresetParams.motor_rated_rpm,
      motor_rated_current: parseFloat(motorParams.motor_rated_current) || basePresetParams.motor_rated_current,
      motor_peak_current: parseFloat(motorParams.motor_peak_current) || basePresetParams.motor_peak_current,

      swerve_mu_ground: parseFloat(motorParams.swerve_mu_ground) || basePresetParams.swerve_mu_ground,
      swerve_carpet_factor: parseFloat(motorParams.swerve_carpet_factor) || basePresetParams.swerve_carpet_factor,
      swerve_roll_resistance: parseFloat(motorParams.swerve_roll_resistance) || basePresetParams.swerve_roll_resistance,
      swerve_eta_slip: parseFloat(motorParams.swerve_eta_slip) || basePresetParams.swerve_eta_slip,
      swerve_hardness_shoreA: parseFloat(motorParams.swerve_hardness_shoreA) || basePresetParams.swerve_hardness_shoreA,
      swerve_T_mech_drive: parseFloat(motorParams.swerve_T_mech_drive) || basePresetParams.swerve_T_mech_drive,
      swerve_T_mech_steer: parseFloat(motorParams.swerve_T_mech_steer) || basePresetParams.swerve_T_mech_steer,
      swerve_redundancy: parseFloat(motorParams.swerve_redundancy) || basePresetParams.swerve_redundancy,
    };
  }, [basePresetParams, motorParams]);

  const result = useMemo(() => {
    return Swerve_Evaluate_Case({
      vx: parseFloat(inputs.vx) || 0,
      vy: parseFloat(inputs.vy) || 0,
      omega_z: parseFloat(inputs.omega_z) || 0,
      dt: parseFloat(inputs.dt) || 0.02,
      ax: parseFloat(inputs.ax) || 0,
      ay: parseFloat(inputs.ay) || 0,
    }, p);
  }, [inputs, p]);

  const ratedResult = useMemo(() => {
    return Swerve_Evaluate_Case({
      vx: parseFloat(inputs.vx) || 0,
      vy: parseFloat(inputs.vy) || 0,
      omega_z: parseFloat(inputs.omega_z) || 0,
      dt: parseFloat(inputs.dt) || 0.02,
      ax: 0,
      ay: 0,
    }, p);
  }, [inputs, p]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setInputs(prev => ({ ...prev, [name]: value }));
  };

  const handleMotorParamChange = (e) => {
    const { name, value } = e.target;
    
    setMotorParams(prev => {
      const next = { ...prev, [name]: value };
      const numValue = parseFloat(value);
      
      // 单向计算：修改扭矩或转速时，计算额定功率 P = T * rpm * pi / 30
      if (name === 'motor_rated_torque' || name === 'motor_rated_rpm') {
        const T = name === 'motor_rated_torque' ? numValue : parseFloat(prev.motor_rated_torque);
        const rpm = name === 'motor_rated_rpm' ? numValue : parseFloat(prev.motor_rated_rpm);
        if (!isNaN(T) && !isNaN(rpm)) {
          next.motor_rated_power = (T * rpm * Math.PI / 30).toFixed(1);
        }
      }
      
      // 单向计算：修改电流或额定扭矩时，计算峰值扭矩 T_peak = T_rated * (I_peak / I_rated)
      if (name === 'motor_rated_current' || name === 'motor_peak_current' || name === 'motor_rated_torque') {
        const T_rated = name === 'motor_rated_torque' ? numValue : parseFloat(prev.motor_rated_torque);
        const I_rated = name === 'motor_rated_current' ? numValue : parseFloat(prev.motor_rated_current);
        const I_peak = name === 'motor_peak_current' ? numValue : parseFloat(prev.motor_peak_current);
        if (!isNaN(T_rated) && !isNaN(I_rated) && !isNaN(I_peak) && I_rated !== 0) {
          next.motor_peak_torque = (T_rated * (I_peak / I_rated)).toFixed(2);
        }
      }
      
      return next;
    });
    setMotorPresetKey('自定义'); // 只要手动修改了参数，就切换回自定义
  };

  const handleMotorPresetChange = (e) => {
    const key = e.target.value;
    setMotorPresetKey(key);
    const presetData = MOTOR_PRESETS_DB[key];
    if (presetData) {
      setMotorParams(prev => ({ ...prev, ...presetData }));
    }
  };

  const chartData = result.wheel_names.map((name, i) => ({
    name,
    '当前驱动扭矩 (N·m)': result.drive_torque[i],
    '额定驱动扭矩 (N·m)': ratedResult.drive_torque[i],
    '当前转向扭矩 (N·m)': result.steer_torque[i],
    '额定转向扭矩 (N·m)': ratedResult.steer_torque[i],
    '法向载荷 (N)': result.dyn_debug.Fz[i],
    '轮胎下压 (mm)': result.dyn_debug.delta[i] * 1000,
    '打滑状态': result.slip_flag[i] ? '打滑' : '正常'
  }));

  return (
    <div className="min-h-screen p-6 text-gray-800">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header */}
        <header className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <Activity size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Swerve Wheel Maker Dashboard</h1>
              <p className="text-sm text-gray-500 mt-1">四轮舵轮底盘性能评估与参数分析</p>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Panel: Inputs */}
          <div className="lg:col-span-3 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5 flex items-center gap-2">
                <Settings size={18} className="text-gray-500" /> 机器人预设
              </h2>
              <select 
                className="w-full p-3 border border-gray-200 rounded-xl text-base font-medium bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow"
                value={preset}
                onChange={(e) => setPreset(e.target.value)}
              >
                <option>Swerve 四轮舵轮 - 默认</option>
                <option>Swerve 四轮舵轮 - 轻量小车预设</option>
                <option>Swerve 四轮舵轮 - 重载底盘预设</option>
                <option>Swerve 三轮舵轮 - 默认</option>
              </select>

              <div className="mt-5 space-y-3 text-sm text-gray-600 bg-gray-50 p-4 rounded-xl border border-gray-100">
                <div className="flex justify-between items-center">
                  <span>全车质量 (kg):</span>
                  <input 
                    type="number" step="0.1" name="swerve_m_total" 
                    value={motorParams.swerve_m_total} onChange={handleMotorParamChange} 
                    className="w-24 p-1 text-right border border-gray-200 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>轴距 X (mm):</span>
                  <input 
                    type="number" step="1" name="swerve_wheel_base_x" 
                    value={motorParams.swerve_wheel_base_x} onChange={handleMotorParamChange} 
                    className="w-24 p-1 text-right border border-gray-200 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>轮距 Y (mm):</span>
                  <input 
                    type="number" step="1" name="swerve_wheel_base_y" 
                    value={motorParams.swerve_wheel_base_y} onChange={handleMotorParamChange} 
                    className="w-24 p-1 text-right border border-gray-200 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>轮胎半径 (mm):</span>
                  <input 
                    type="number" step="0.1" name="swerve_wheel_radius" 
                    value={motorParams.swerve_wheel_radius} onChange={handleMotorParamChange} 
                    className="w-24 p-1 text-right border border-gray-200 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>轮胎宽度 (m):</span>
                  <input 
                    type="number" step="0.001" name="swerve_wheel_width" 
                    value={motorParams.swerve_wheel_width} onChange={handleMotorParamChange} 
                    className="w-24 p-1 text-right border border-gray-200 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>重心高度 (m):</span>
                  <input 
                    type="number" step="0.01" name="swerve_h_cog" 
                    value={motorParams.swerve_h_cog} onChange={handleMotorParamChange} 
                    className="w-24 p-1 text-right border border-gray-200 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                  />
                </div>
                <div className="flex justify-between items-center">
                  <span>转动惯量 (kg·m²):</span>
                  <input 
                    type="number" step="0.001" name="swerve_I_steer" 
                    value={motorParams.swerve_I_steer} onChange={handleMotorParamChange} 
                    className="w-24 p-1 text-right border border-gray-200 rounded-lg font-bold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 bg-white" 
                  />
                </div>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                  <Cpu size={18} className="text-gray-500" /> 工程常数 / 环境 / 电机传动
                </h2>
                <select 
                  className="p-1.5 text-xs font-semibold border border-gray-200 rounded-lg bg-gray-50 outline-none focus:ring-2 focus:ring-blue-500"
                  value={motorPresetKey}
                  onChange={handleMotorPresetChange}
                >
                  {Object.keys(MOTOR_PRESETS_DB).map(key => (
                    <option key={key} value={key}>{key}</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-x-3 gap-y-4">
                {[
                  { label: '驱动电机最高转速(RPM)', name: 'swerve_motor_max_rpm', col: 2 },
                  { label: '转向电机最高转速(RPM)', name: 'swerve_steer_max_rpm', col: 2 },
                  { label: '驱动减速比', name: 'swerve_i_drive', col: 1 },
                  { label: '转向减速比', name: 'swerve_i_steer', col: 1 },
                  { label: '额定功率(W)', name: 'motor_rated_power', col: 1 },
                  { label: 'KV数(RPM/V)', name: 'motor_kv', col: 1 },
                  { label: '额定扭矩(N·m)', name: 'motor_rated_torque', col: 1 },
                  { label: '峰值扭矩(N·m)', name: 'motor_peak_torque', col: 1 },
                  { label: '额定转速(RPM)', name: 'motor_rated_rpm', col: 2 },
                  { label: '额定电流(A)', name: 'motor_rated_current', col: 1 },
                  { label: '峰值电流(A)', name: 'motor_peak_current', col: 1 },
                  { label: '基准摩擦系数', name: 'swerve_mu_ground', col: 1 },
                  { label: '地胶阻力放大', name: 'swerve_carpet_factor', col: 1 },
                  { label: '滚动阻力系数', name: 'swerve_roll_resistance', col: 1 },
                  { label: '滑移效率', name: 'swerve_eta_slip', col: 1 },
                  { label: '轮胎邵氏硬度', name: 'swerve_hardness_shoreA', col: 1 },
                  { label: '安全冗余系数', name: 'swerve_redundancy', col: 1 },
                  { label: '驱动机械损耗(N·m)', name: 'swerve_T_mech_drive', col: 1 },
                  { label: '转向机械损耗(N·m)', name: 'swerve_T_mech_steer', col: 1 }
                ].map((field) => (
                  <div key={field.name} className={field.col === 2 ? "col-span-2" : "col-span-1"}>
                    <label className="block text-xs font-medium text-gray-600 mb-1">{field.label}</label>
                    <input 
                      type="number" 
                      step="0.1"
                      name={field.name}
                      value={motorParams[field.name]}
                      onChange={handleMotorParamChange}
                      className="w-full p-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-50 focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-5">测试工况</h2>
              <div className="space-y-5">
                {[
                  { label: '前向速度 vx (m/s)', name: 'vx' },
                  { label: '右向速度 vy (m/s)', name: 'vy' },
                  { label: '自转角速度 ωz (rad/s)', name: 'omega_z' },
                  { label: '控制周期 dt (s)', name: 'dt' },
                  { label: '前向真实加速度 ax (m/s²)', name: 'ax' },
                  { label: '右向真实加速度 ay (m/s²)', name: 'ay' }
                ].map((field) => (
                  <div key={field.name}>
                    <label className="block text-sm font-medium text-gray-700 mb-2">{field.label}</label>
                    <input 
                      type="number" 
                      step="0.1"
                      name={field.name}
                      value={inputs[field.name]}
                      onChange={handleInputChange}
                      className="w-full p-3 border border-gray-200 rounded-xl text-base font-semibold text-gray-900 outline-none focus:ring-2 focus:ring-blue-500 transition-shadow bg-gray-50 focus:bg-white"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Panel: Results */}
          <div className="lg:col-span-9 space-y-6">
            
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">峰值驱动扭矩</div>
                  <Zap size={18} className="text-blue-500" />
                </div>
                <div className="text-4xl font-extrabold text-blue-600 mt-1">
                  {result.max_drive_torque.toFixed(2)} <span className="text-base font-medium text-gray-400">N·m</span>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">峰值转向扭矩</div>
                  <RotateCcw size={18} className="text-indigo-500" />
                </div>
                <div className="text-4xl font-extrabold text-indigo-600 mt-1">
                  {result.max_steer_torque.toFixed(2)} <span className="text-base font-medium text-gray-400">N·m</span>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">最大抓地利用率</div>
                  <Target size={18} className={result.max_grip_usage > 1 ? 'text-red-500' : 'text-emerald-500'} />
                </div>
                <div className={`text-4xl font-extrabold mt-1 ${result.max_grip_usage > 1 ? 'text-red-500' : 'text-emerald-600'}`}>
                  {(result.max_grip_usage * 100).toFixed(1)} <span className="text-base font-medium">{result.max_grip_usage > 1 ? '(打滑)' : '%'}</span>
                </div>
              </div>
              
              <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-sm font-medium text-gray-500">理论最大直线速度</div>
                  <Gauge size={18} className="text-orange-500" />
                </div>
                <div className="text-4xl font-extrabold text-orange-600 mt-1">
                  {result.limits.max_drive_speed.toFixed(2)} <span className="text-base font-medium text-gray-400">m/s</span>
                </div>
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[340px]">
                <h3 className="text-base font-bold text-gray-900 mb-6">驱动扭矩对比 (当前 vs 额定)</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#9ca3af' }} />
                    <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <Legend iconType="circle" wrapperStyle={{ paddingTop: '20px' }} />
                    <Bar dataKey="当前驱动扭矩 (N·m)" fill="#3b82f6" radius={[6,6,0,0]} maxBarSize={40} />
                    <Bar dataKey="额定驱动扭矩 (N·m)" fill="#bfdbfe" radius={[6,6,0,0]} maxBarSize={40} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-[340px]">
                <h3 className="text-base font-bold text-gray-900 mb-6">法向载荷分布</h3>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 14, fill: '#6b7280', fontWeight: 500 }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 13, fill: '#9ca3af' }} />
                    <Tooltip cursor={{fill: '#f9fafb'}} contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                    <ReferenceLine y={result.dyn_debug.Fz_static} stroke="#ef4444" strokeDasharray="4 4" label={{ position: 'top', value: '静态载荷', fill: '#ef4444', fontSize: 12, fontWeight: 600 }} />
                    <Bar dataKey="法向载荷 (N)" fill="#10b981" radius={[6,6,0,0]} maxBarSize={50} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-5 border-b border-gray-100 bg-gray-50/50">
                <h3 className="text-base font-bold text-gray-900">逐轮详细结果</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-base text-left">
                  <thead className="bg-gray-50 text-gray-500 border-b border-gray-100">
                    <tr>
                      <th className="px-5 py-4 font-semibold">轮位</th>
                      <th className="px-5 py-4 font-semibold">驱动速度(m/s)</th>
                      <th className="px-5 py-4 font-semibold">目标舵角(deg)</th>
                      <th className="px-5 py-4 font-semibold">当前驱动扭矩</th>
                      <th className="px-5 py-4 font-semibold">当前转向扭矩</th>
                      <th className="px-5 py-4 font-semibold">法向载荷(N)</th>
                      <th className="px-5 py-4 font-semibold">轮胎下压(mm)</th>
                      <th className="px-5 py-4 font-semibold">抓地利用率</th>
                      <th className="px-5 py-4 font-semibold">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {chartData.map((row, i) => (
                      <tr key={row.name} className="hover:bg-blue-50/50 transition-colors">
                        <td className="px-5 py-4 font-bold text-gray-900">{row.name}</td>
                        <td className="px-5 py-4 font-medium text-gray-700">{result.v_drive[i].toFixed(2)}</td>
                        <td className="px-5 py-4 font-medium text-gray-700">{(result.theta_steer[i] * 180 / Math.PI).toFixed(1)}</td>
                        <td className="px-5 py-4 font-bold text-blue-600">{row['当前驱动扭矩 (N·m)'].toFixed(2)}</td>
                        <td className="px-5 py-4 font-bold text-indigo-600">{row['当前转向扭矩 (N·m)'].toFixed(2)}</td>
                        <td className="px-5 py-4 font-medium text-emerald-600">{row['法向载荷 (N)'].toFixed(1)}</td>
                        <td className="px-5 py-4 font-medium text-gray-700">{row['轮胎下压 (mm)'].toFixed(2)}</td>
                        <td className="px-5 py-4 font-bold text-gray-900">{(result.dyn_debug.grip_usage[i] * 100).toFixed(1)}%</td>
                        <td className="px-5 py-4">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                            row['打滑状态'] === '打滑' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                          }`}>
                            {row['打滑状态']}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

export default App;