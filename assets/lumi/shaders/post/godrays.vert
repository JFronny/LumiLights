#include lumi:shaders/post/common/header.glsl
#include frex:shaders/api/view.glsl
#include frex:shaders/api/world.glsl
#include frex:shaders/lib/math.glsl
#include lumi:shaders/lib/util.glsl
#include lumi:shaders/common/atmosphere.glsl

/*******************************************************
 *  lumi:shaders/post/godrays.vert                     *
 *******************************************************
 *  Copyright (c) 2020-2021 spiralhalo                 *
 *  Released WITHOUT WARRANTY under the terms of the   *
 *  GNU Lesser General Public License version 3 as     *
 *  published by the Free Software Foundation, Inc.    *
 *******************************************************/

uniform sampler2D u_color;

out float v_godray_intensity;
out vec2 v_invSize;
out vec2 v_skylightpos;

void main()
{
    vec4 screen = frxu_frameProjectionMatrix * vec4(in_vertex.xy * frxu_size, 0.0, 1.0);
    gl_Position = vec4(screen.xy, 0.2, 1.0);
    v_texcoord = in_uv;
    v_up = frx_normalModelMatrix() * vec3(0.0, 1.0, 0.0);
    v_invSize = 1. / frxu_size;

    atmos_generateAtmosphereModel();

    // TODO: rain factor but only above water
    float dimensionFactor = frx_worldFlag(FRX_WORLD_HAS_SKYLIGHT) ? 1.0 : 0.0;
    float blindnessFactor = frx_playerHasEffect(FRX_EFFECT_BLINDNESS) ? 0.0 : 1.0;
    float notInVoidFactor = l2_clampScale(-1.0, 0.0, frx_cameraPos().y);
    float notInFluidFactor = frx_viewFlag(FRX_CAMERA_IN_FLUID) ? (frx_viewFlag(FRX_CAMERA_IN_WATER) ? 1.0 : 0.0) : 1.0;
    // float brightnessFactor = 1.0 - 0.3 * frx_viewBrightness(); // adjust because godrays are added after tonemap

    v_godray_intensity = 1.0
        * atmosv_celestIntensity
        * dimensionFactor
        * blindnessFactor
        * notInVoidFactor
        * notInFluidFactor
        * frx_skyLightTransitionFactor()
        // * brightnessFactor
        * USER_GODRAYS_INTENSITY;



    #if SKY_MODE == SKY_MODE_LUMI
        vec3 skyLightVector = frx_skyLightVector();
    #else
        // Remove zenith angle tilt until Canvas implements it on vanilla celestial object
        vec3 skyLightVector = normalize(vec3(frx_skyLightVector().xy, 0.0));
    #endif

    vec4 skylight_clip = frx_projectionMatrix() * vec4(frx_normalModelMatrix() * skyLightVector * 1000, 1.0);

    v_skylightpos = (skylight_clip.xy / skylight_clip.w) * 0.5 + 0.5;
}
