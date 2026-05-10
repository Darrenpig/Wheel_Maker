import { Config_Params, mergeWithDefaults } from './Config_Params';

export function Swerve_Dynamics_Core(ax, ay, alpha_steer, p_in) {
    const p = mergeWithDefaults(p_in);
    
    const s = p.swerve_hardness_shoreA;
    const E = ((0.0981 * (56 + 7.66 * s)) / (0.149 * (100 - s))) * 1e6;
    const s_ref = Config_Params.swerve_hardness_shoreA;
    const E_ref = ((0.0981 * (56 + 7.66 * s_ref)) / (0.149 * (100 - s_ref))) * 1e6;
    
    let mu = p.swerve_mu_ground * Math.pow(E_ref / E, 2/3);
    mu = Math.min(Math.max(mu, 0.1), 1.5);
    
    const m = p.swerve_m_total;
    const g = p.g;
    const h = p.swerve_h_cog;
    const Lx = p.swerve_wheel_base_x / 2;
    const Ly = p.swerve_wheel_base_y / 2;
    const wheel_count = p.swerve_wheel_count || 4;
    
    let Fz_static, dFz_x, dFz_y, Fz_unclipped;
    
    if (wheel_count === 3) {
        Fz_static = m * g / 3;
        dFz_x = (m * ax * h) / (2 * Lx);
        dFz_y = (m * ay * h) / (2 * Ly);
        Fz_unclipped = [
            m * g / 2 - dFz_x,
            m * g / 4 + dFz_x / 2 - dFz_y,
            m * g / 4 + dFz_x / 2 + dFz_y
        ];
    } else {
        const Lx_full = p.swerve_wheel_base_x;
        const Ly_full = p.swerve_wheel_base_y;
        Fz_static = m * g / 4;
        dFz_x = (m * ax * h) / (2 * Lx_full);
        dFz_y = (m * ay * h) / (2 * Ly_full);
        
        Fz_unclipped = [
            Fz_static - dFz_x + dFz_y,
            Fz_static - dFz_x - dFz_y,
            Fz_static + dFz_x - dFz_y,
            Fz_static + dFz_x + dFz_y
        ];
    }
    
    const Fz = Fz_unclipped.map(v => Math.max(v, 0));
    let Fz_total = Fz.reduce((a, b) => a + b, 0);
    if (Fz_total <= 1e-10) Fz_total = 1e-10;
    
    const Fx_total = m * ax;
    const Fy_total = m * ay;
    const R = p.swerve_wheel_radius;
    const w = p.swerve_wheel_width;
    
    let Drive_Torque = new Array(wheel_count).fill(0);
    let Steer_Torque = new Array(wheel_count).fill(0);
    let Slip_Warning = new Array(wheel_count).fill(0);
    
    let Fx_i_all = new Array(wheel_count).fill(0), Fy_i_all = new Array(wheel_count).fill(0), F_total_i_all = new Array(wheel_count).fill(0);
    let muFz_all = new Array(wheel_count).fill(0), grip_usage_all = new Array(wheel_count).fill(0);
    let delta_all = new Array(wheel_count).fill(0), contact_half_len_all = new Array(wheel_count).fill(0);
    
    for (let i = 0; i < wheel_count; i++) {
        if (Fz[i] <= 1e-10) {
            Slip_Warning[i] = 1;
            continue;
        }
        
        const Fx_i = Fx_total * Fz[i] / Fz_total;
        const Fy_i = Fy_total * Fz[i] / Fz_total;
        const F_total_i = Math.hypot(Fx_i, Fy_i);
        
        Fx_i_all[i] = Fx_i;
        Fy_i_all[i] = Fy_i;
        F_total_i_all[i] = F_total_i;
        
        const delta = Fz[i] / (E * w);
        const contact_expr = Math.max(0, 2 * R * delta - delta * delta);
        const contact_half_len = Math.sqrt(contact_expr);
        
        delta_all[i] = delta;
        contact_half_len_all[i] = contact_half_len;
        
        const T_roll = Fz[i] * R * p.swerve_roll_resistance * p.swerve_carpet_factor;
        const T_drv_wheel = T_roll + p.swerve_T_mech_drive + (F_total_i * R) / p.swerve_eta_slip;
        Drive_Torque[i] = (T_drv_wheel / p.swerve_i_drive) * p.swerve_redundancy;
        
        const M_f = mu * Fz[i] * Math.hypot(contact_half_len, w/2) / 1.5;
        const T_str_wheel = M_f + p.swerve_T_mech_steer + p.swerve_I_steer * Math.abs(alpha_steer[i]);
        Steer_Torque[i] = (T_str_wheel / p.swerve_i_steer) * p.swerve_redundancy;
        
        const muFz = mu * Fz[i];
        muFz_all[i] = muFz;
        
        grip_usage_all[i] = muFz > 1e-10 ? F_total_i / muFz : Infinity;
        
        if (F_total_i > muFz) {
            Slip_Warning[i] = 1;
        }
    }
    
    return {
        Drive_Torque,
        Steer_Torque,
        Slip_Warning,
        debug: {
            mu, E, Fz_static, dFz_x_per_wheel: dFz_x, dFz_y_per_wheel: dFz_y,
            Fz_unclipped, Fz, Fx_total, Fy_total, Fx_i: Fx_i_all, Fy_i: Fy_i_all,
            F_total_i: F_total_i_all, muFz: muFz_all, grip_usage: grip_usage_all,
            delta: delta_all, contact_half_len: contact_half_len_all
        }
    };
}