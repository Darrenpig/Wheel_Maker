import { mergeWithDefaults } from './Config_Params';

function localWrapToPi(theta) {
    let t = (theta + Math.PI) % (2 * Math.PI);
    if (t < 0) t += 2 * Math.PI;
    return t - Math.PI;
}

export function Swerve_Kinematics_Solver(vx, vy, omega_z, current_theta, dt = 0.02, p_in) {
    const p = mergeWithDefaults(p_in);
    const wheel_count = p.swerve_wheel_count || 4;
    
    if (!current_theta || current_theta.length !== wheel_count) {
        current_theta = new Array(wheel_count).fill(0);
    }

    const Lx = (p.swerve_wheel_base_x / 1000) / 2;
    const Ly = (p.swerve_wheel_base_y / 1000) / 2;
    
    let pos_matrix;
    if (wheel_count === 3) {
        pos_matrix = [
            [Lx, 0],
            [-Lx, Ly],
            [-Lx, -Ly]
        ];
    } else {
        pos_matrix = [
            [Lx, -Ly],
            [Lx, Ly],
            [-Lx, Ly],
            [-Lx, -Ly]
        ];
    }
    
    const max_steer_w = (p.swerve_steer_max_rpm / p.swerve_i_steer) * (2 * Math.PI / 60);
    const max_drive_v = (p.swerve_motor_max_rpm / p.swerve_i_drive) * (2 * Math.PI / 60) * (p.swerve_wheel_radius / 1000);
    
    let v_drive_out = new Array(wheel_count).fill(0);
    let theta_steer_out = new Array(wheel_count).fill(0);
    let omega_steer_out = new Array(wheel_count).fill(0);
    
    let raw_theta = new Array(wheel_count).fill(0);
    let raw_speed = new Array(wheel_count).fill(0);
    let optimized_flip = new Array(wheel_count).fill(false);
    
    for (let i = 0; i < wheel_count; i++) {
        const x_i = pos_matrix[i][0];
        const y_i = pos_matrix[i][1];
        
        const v_ix = vx + omega_z * y_i;
        const v_iy = vy - omega_z * x_i;
        
        let v_target = Math.hypot(v_ix, v_iy);
        let theta_target = Math.atan2(v_iy, v_ix);
        
        raw_theta[i] = theta_target;
        raw_speed[i] = v_target;
        
        let delta_theta = localWrapToPi(theta_target - current_theta[i]);
        if (Math.abs(delta_theta) > Math.PI / 2) {
            theta_target = localWrapToPi(theta_target - Math.sign(delta_theta) * Math.PI);
            v_target = -v_target;
            delta_theta = localWrapToPi(theta_target - current_theta[i]);
            optimized_flip[i] = true;
        }
        
        let req_w = delta_theta / dt;
        
        if (Math.abs(req_w) > max_steer_w) {
            req_w = Math.sign(req_w) * max_steer_w;
            let actual_theta = localWrapToPi(current_theta[i] + req_w * dt);
            
            let angle_error = localWrapToPi(actual_theta - theta_target);
            v_target = v_target * Math.cos(angle_error);
            
            theta_target = actual_theta;
        }
        
        if (Math.abs(v_target) > max_drive_v) {
            v_target = Math.sign(v_target) * max_drive_v;
        }
        
        v_drive_out[i] = v_target;
        theta_steer_out[i] = localWrapToPi(theta_target);
        omega_steer_out[i] = req_w;
    }
    
    return {
        v_drive_out,
        theta_steer_out,
        omega_steer_out,
        debug: {
            pos_matrix, max_steer_w, max_drive_v, raw_theta, raw_speed, optimized_flip
        }
    };
}