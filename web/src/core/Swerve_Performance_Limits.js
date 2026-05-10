import { mergeWithDefaults } from './Config_Params';

export function Swerve_Performance_Limits(p_in) {
    const p = mergeWithDefaults(p_in);
    
    const R = p.swerve_wheel_radius;
    const Lx = p.swerve_wheel_base_x / 2;
    const Ly = p.swerve_wheel_base_y / 2;
    
    const max_drive_speed = (p.swerve_motor_max_rpm / p.swerve_i_drive) * (2 * Math.PI / 60) * R;
    const max_spin_rate = max_drive_speed / Math.hypot(Lx, Ly);
    const max_steer_rate = (p.swerve_steer_max_rpm / p.swerve_i_steer) * (2 * Math.PI / 60);
    
    return {
        max_drive_speed,
        max_spin_rate,
        max_steer_rate
    };
}