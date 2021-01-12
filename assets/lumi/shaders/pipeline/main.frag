#include frex:shaders/api/sampler.glsl
#include frex:shaders/api/fragment.glsl
#include frex:shaders/api/material.glsl
#include frex:shaders/api/world.glsl
#include frex:shaders/api/view.glsl
#include lumi:shaders/internal/context.glsl
#include lumi:shaders/api/param_frag.glsl

/*******************************************************
 *  lumi:shaders/pipeline/main.frag                    *
 *******************************************************
 *  Copyright (c) 2020-2021 spiralhalo                 *
 *  Released WITHOUT WARRANTY under the terms of the   *
 *  GNU Lesser General Public License version 3 as     *
 *  published by the Free Software Foundation, Inc.    *
 *******************************************************/

#include lumi:shaders/pipeline/varying.glsl

frx_FragmentData frx_createPipelineFragment() {
#ifdef VANILLA_LIGHTING
	return frx_FragmentData (
		texture2D(frxs_spriteAltas, frx_texcoord, frx_matUnmippedFactor() * -4.0),
		frx_color,
		frx_matEmissive() ? 1.0 : 0.0,
		!frx_matDisableDiffuse(),
		!frx_matDisableAo(),
		frx_normal,
		pv_lightcoord,
		pv_ao
	);
#else
	return frx_FragmentData (
		texture2D(frxs_spriteAltas, frx_texcoord, frx_matUnmippedFactor() * -4.0),
		frx_color,
		frx_matEmissive() ? 1.0 : 0.0,
		!frx_matDisableDiffuse(),
		!frx_matDisableAo(),
		frx_normal
	);
#endif
}

void frx_writePipelineFragment(in frx_FragmentData fragData)
{
    vec4 a = clamp(fragData.spriteColor * fragData.vertexColor, 0.0, 1.0);
    if (frx_isGui()) {
        if (fragData.diffuse) {
            float diffuse = mix(pv_diffuse, 1, fragData.emissivity);
            a.rgb *= diffuse;
        }
        gl_FragDepth = gl_FragCoord.z;
        gl_FragData[0] = a;
    } else {

		vec3 shadowCoords = pv_shadowpos.xyz / pv_shadowpos.w;
		// Transform from screen coordinates to texture coordinates
		shadowCoords = shadowCoords * 0.5 + 0.5;
		float shadowFactor = 0.0;
		vec2 inc = vec2(1.0 / 16384.0);
		float shadowDepth;
		for(int row = -1; row <= 1; ++row)
		{
			for(int col = -1; col <= 1; ++col)
			{
				shadowDepth = texture2D(frxs_shadowMap, shadowCoords.xy + vec2(row, col) * inc).r; 
				shadowFactor += shadowDepth < shadowCoords.z ? 0.2 : 0.0;      
			}    
		}
		shadowFactor /= 9.0;
		float directSkylight = 1.0 - shadowFactor;
		
		vec2 light = fragData.light.xy;
		light.y = min(directSkylight, light.y);
		// hijack f0 for matHurt and matflash because hurting things are not reflective I guess
		if (frx_matFlash()) pbr_f0 = 1.0;
		else if (frx_matHurt()) pbr_f0 = 0.9;
		else pbr_f0 = min(0.8, pbr_f0);

        vec3 normalizedNormal = (!fragData.diffuse) ? vec3(1.0, 1.0, 1.0) : (normalize(fragData.vertexNormal) * 0.5 + 0.5);
        float bloom = fragData.emissivity * a.a;
		float ao = fragData.ao ? (1.0 - fragData.aoShade) * a.a : 0.0;
		float normalizedBloom = (bloom - ao) * 0.5 + 0.5;
        gl_FragDepth = gl_FragCoord.z;
        gl_FragData[0] = a;
        gl_FragData[1] = vec4(light.x, light.y, normalizedBloom, 1.0);
        gl_FragData[2] = vec4(normalizedNormal, 1.0);
        gl_FragData[3] = vec4(pbr_roughness, pbr_metallic, pbr_f0, 1.0);
    }
}