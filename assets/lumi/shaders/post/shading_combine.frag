#include lumi:shaders/post/common/header.glsl
#include lumi:shaders/common/userconfig.glsl
#include lumi:shaders/func/tile_noise.glsl
#include lumi:shaders/func/tonemap.glsl
#include lumi:shaders/lib/util.glsl

/*******************************************************
 *  lumi:shaders/post/shading_combine.frag             *
 *******************************************************
 *  Copyright (c) 2020-2021 spiralhalo                 *
 *  Released WITHOUT WARRANTY under the terms of the   *
 *  GNU Lesser General Public License version 3 as     *
 *  published by the Free Software Foundation, Inc.    *
 *******************************************************/

uniform sampler2D u_hdr_solid;
uniform sampler2D u_material_solid;
uniform sampler2D u_hdr_solid_swap;

uniform sampler2D u_hdr_translucent;
uniform sampler2D u_material_translucent;
uniform sampler2D u_hdr_translucent_swap;

uniform sampler2D u_blue_noise;

frag_in vec2 v_invSize;

#ifndef USING_OLD_OPENGL
out vec4[2] fragColor;
#endif

vec4 hdr_combine(sampler2D a, sampler2D matA, sampler2D b, vec2 uv)
{
#ifdef HALF_REFLECTION_RESOLUTION
    vec2 buv = (uv + (getRandomVec(u_blue_noise, uv, frxu_size).xy * 2. - 1.) * v_invSize * 2.) * 0.5;
#else
    vec2 buv = uv;
#endif
    vec4 a1 = texture(a, uv);
    vec4 b1 = texture(b, buv);
    bool filtered = b1.a == 0.0; // unmanaged
#ifdef HALF_REFLECTION_RESOLUTION
    const float ROUGHNESS_TOLERANCE = 0.1;
    float a1r = texture(matA, uv).r;
    filtered = filtered || abs(b1.a - a1r) > ROUGHNESS_TOLERANCE; // roughness mismatch
#endif
    b1 = filtered ? vec4(0.0) : b1;
    b1.rgb *= b1.rgb; // anti-banding
    return vec4(a1.rgb + b1.rgb, a1.a);
}

void main()
{
    fragColor[0] = hdr_combine(u_hdr_solid, u_material_solid, u_hdr_solid_swap, v_texcoord);
    fragColor[1] = hdr_combine(u_hdr_translucent, u_material_translucent, u_hdr_translucent_swap, v_texcoord);
}
