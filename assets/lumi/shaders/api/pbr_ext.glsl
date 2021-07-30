/*******************************************************
 *  lumi:shaders/api/pbr_ext.glsl
 *******************************************************/

/*** API ***/

/** GENERAL INFORMATION **
 * 
 * Lumi Lights PBR Extension API.
 *
 * USAGE
 * Import this API in your fragment shader. Assign material properties be interpreted by the pipeline.
 * Guard every property assignment using `#ifdef LUMI_PBR_API >= {required version}` to ensure
 * forward compatibility and fail-safety.
 */

/* API version */
#define LUMI_PBR_API 5

#ifndef VERTEX_SHADER

/* Roughness property -- ALL VERSIONS */
float pbr_roughness = 1.0;

/* Metalness property -- ALL VERSIONS */
float pbr_metallic = 0.0;

/* Initial reflectivity -- Require version 2 */
float pbr_f0 = -1.0;

/* Microfacet normal -- Require version 3 */
vec3  pbr_normalMicro = vec3(99., 99., 99.);

/* Water flag. Lumi Lights handle water exceptionally -- Require version 4 */
bool  pbr_isWater = false;

#endif



/*** LEGACY API ***/

#ifdef VERTEX_SHADER

/* Usable tangent vector vertex output */
out vec3 l2_tangent;

#else

/* Usable tangent vector fragment input */
in vec3 l2_tangent;

#endif

/* Deprecated. Use LUMI_PBR_API instead */
#define LUMI_PBRX



/*** BACKWARDS COMPATIBILITY ***/

#include lumi:shaders/api/bump_ext.glsl

#ifdef VERTEX_SHADER
#define pbrExt_tangentSetup(normal) l2_tangent = bumpExt_computeTangent_v1(normal)
#endif
