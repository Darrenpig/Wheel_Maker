import { mergeWithDefaults } from './Config_Params';
import { Swerve_Performance_Limits } from './Swerve_Performance_Limits';
import { Swerve_Kinematics_Solver } from './Swerve_Kinematics_Solver';
import { Swerve_Dynamics_Core } from './Swerve_Dynamics_Core';

export function Swerve_Evaluate_Case(caseIn = {}, p_in) {
    const p = mergeWithDefaults(p_in);
    const wheel_count = p.swerve_wheel_count || 4;
    
    const vx = caseIn.vx || 0.0;
    const vy = caseIn.vy || 0.0;
    const omega_z = caseIn.omega_z || 0.0;
    const ax = caseIn.ax || 0.0;
    const ay = caseIn.ay || 0.0;
    const dt = (caseIn.dt && caseIn.dt > 0) ? caseIn.dt : 0.02;
    const current_theta = caseIn.current_theta && caseIn.current_theta.length === wheel_count ? caseIn.current_theta : new Array(wheel_count).fill(0);
    
    const limits = Swerve_Performance_Limits(p);
    
    const { v_drive_out, theta_steer_out, omega_steer_out, debug: kin_debug } = 
        Swerve_Kinematics_Solver(vx, vy, omega_z, current_theta, dt, p);
        
    let alpha_steer = caseIn.alpha_steer;
    if (!alpha_steer || alpha_steer.length !== wheel_count) {
        alpha_steer = omega_steer_out.map(w => Math.min(Math.abs(w) / dt, p.swerve_target_max_alpha));
    }
    
    const { Drive_Torque, Steer_Torque, Slip_Warning, debug: dyn_debug } = 
        Swerve_Dynamics_Core(ax, ay, alpha_steer, p);
        
    const max_drive_torque = Math.max(...Drive_Torque);
    const max_steer_torque = Math.max(...Steer_Torque);
    const max_grip_usage = Math.max(...dyn_debug.grip_usage);
    const max_tire_delta = Math.max(...dyn_debug.delta);
    const max_contact_half_len = Math.max(...dyn_debug.contact_half_len);
    
    const max_grip_wheel_idx = dyn_debug.grip_usage.indexOf(max_grip_usage);
    const max_delta_wheel_idx = dyn_debug.delta.indexOf(max_tire_delta);
    
    return {
        case: { vx, vy, omega_z, ax, ay, dt, current_theta, alpha_steer },
        p,
        limits,
        v_drive: v_drive_out,
        theta_steer: theta_steer_out,
        omega_steer: omega_steer_out,
        alpha_steer,
        drive_torque: Drive_Torque,
        steer_torque: Steer_Torque,
        slip_flag: Slip_Warning,
        kin_debug,
        dyn_debug,
        max_drive_torque,
        max_steer_torque,
        max_grip_usage,
        max_tire_delta,
        max_contact_half_len,
        max_grip_wheel_idx,
        max_delta_wheel_idx,
        wheel_names: wheel_count === 3 ? ["F", "RR", "RL"] : ["FL", "FR", "RR", "RL"]
    };
}