import { Config_Params } from './Config_Params';

export function Swerve_Get_Preset(presetName = 'Swerve 四轮舵轮 - 默认') {
    const p = { ...Config_Params };

    if (presetName.includes('轻量')) {
        p.swerve_m_total = 15.0;
        p.swerve_wheel_base_x = 0.230;
        p.swerve_wheel_base_y = 0.230;
        p.swerve_wheel_radius = 0.035;
        p.swerve_wheel_width = 0.026;
        p.swerve_h_cog = 0.16;
        p.swerve_motor_max_rpm = 600;
        p.swerve_steer_max_rpm = 150;
        p.swerve_target_max_a = 3.5;
    } else if (presetName.includes('重载')) {
        p.swerve_m_total = 35.0;
        p.swerve_wheel_base_x = 0.320;
        p.swerve_wheel_base_y = 0.320;
        p.swerve_wheel_radius = 0.050;
        p.swerve_wheel_width = 0.040;
        p.swerve_h_cog = 0.24;
        p.swerve_motor_max_rpm = 400;
        p.swerve_steer_max_rpm = 100;
        p.swerve_target_max_a = 2.5;
    } else if (presetName.includes('三轮')) {
        p.swerve_wheel_count = 3;
        p.swerve_m_total = 20.0;
        p.swerve_wheel_base_x = 0.300;
        p.swerve_wheel_base_y = 0.300;
        p.swerve_wheel_radius = 0.0425;
        p.swerve_wheel_width = 0.030;
        p.swerve_h_cog = 0.18;
        p.swerve_motor_max_rpm = 500;
        p.swerve_steer_max_rpm = 130;
        p.swerve_target_max_a = 3.0;
    } else if (presetName.includes('Wheel-Leg')) {
        if (p.wl_m_total === undefined) {
            p.wl_m_total = 20.0;
        }
    }
    
    return p;
}