export const Config_Params = {
    // 公共物理常数
    g: 9.81,

    // 机器人本体几何与质量分布
    swerve_m_total: 25.0,
    swerve_wheel_base_x: 0.2700,
    swerve_wheel_base_y: 0.2700,
    swerve_wheel_radius: 0.0425,
    swerve_wheel_width: 0.030,
    swerve_h_cog: 0.2,
    swerve_I_steer: 0.015,
    swerve_wheel_count: 4,

    // 电机与传动系统物理边界
    swerve_i_drive: 1.0,
    swerve_i_steer: 1.0,
    swerve_motor_max_rpm: 450,
    swerve_steer_max_rpm: 120,

    // 常规电机参数 (驱动电机参考)
    motor_rated_power: 250,      // 额定功率 (W)
    motor_kv: 100,               // KV数 (RPM/V)
    motor_rated_torque: 1.2,     // 额定扭矩 (N·m)
    motor_peak_torque: 3.5,      // 峰值扭矩 (N·m)
    motor_rated_rpm: 3000,       // 额定转速 (RPM)
    motor_rated_current: 10,     // 额定电流 (A)
    motor_peak_current: 30,      // 峰值电流 (A)

    // 运动学/动力学性能目标
    swerve_target_max_a: 3.0,
    swerve_target_max_alpha: 20.0,

    // 环境与摩擦学经验常数
    swerve_mu_ground: 0.8,
    swerve_carpet_factor: 4.0,
    swerve_roll_resistance: 0.018,
    swerve_eta_slip: 0.9,
    swerve_hardness_shoreA: 60,
    swerve_T_mech_drive: 0.1,
    swerve_T_mech_steer: 0.1,
    swerve_redundancy: 1.2,

    // 双轮轮腿
    wl_m_total: 20.0,
};

export function mergeWithDefaults(p_in) {
    return { ...Config_Params, ...p_in };
}