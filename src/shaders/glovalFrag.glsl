precision highp float;

const float SHADER_LINE_A = 1.0;
const float SHADER_CIRCLE = 5.0;
varying vec4 v_color;
varying vec4 v_shaderParams;
varying vec2 v_lineStart;
varying vec2 v_lineEnd;
varying vec2 v_worldPos;    // 当前片元的世界坐标
varying vec2 v_position;
varying float v_halfWidth;

void main() {
  // 使用世界坐标进行计算
  vec2 fragPos = v_worldPos;  // 不用gl_FragCoord，用插值的世界坐标
  float mode = v_shaderParams[0];

  if(mode == SHADER_LINE_A) {
    vec2 dir = v_lineEnd - v_lineStart;
    float len = length(dir);

    if(len == 0.0) {
      discard;
    }

    vec2 unitDir = dir / len;
    float t = dot(fragPos - v_lineStart, unitDir) / len;
    vec2 closest = v_lineStart + clamp(t, 0.0, 1.0) * dir;
    float distToLine = length(fragPos - closest);

  // 主线段检查
    if(t >= 0.0 && t <= 1.0 && distToLine <= v_halfWidth) {
      gl_FragColor = v_color;
      return;
    }

  // 起点圆帽
    float distToStart = length(fragPos - v_lineStart);
    if(t < 0.0 && distToStart <= v_halfWidth) {
      gl_FragColor = v_color;
      return;
    }

  // 终点圆帽
    float distToEnd = length(fragPos - v_lineEnd);
    if(t > 1.0 && distToEnd <= v_halfWidth) {
      gl_FragColor = v_color;
      return;
    }

    discard;
  } else if(mode == SHADER_CIRCLE) {
    // 圆心
    float radius = v_shaderParams.z;
    float width = v_shaderParams.w;
    float dist = distance(v_position, fragPos);

    float outerRadius = max(radius, 0.0);
    float innerRadius = max(radius - width, 0.0);
    if(abs(dist) > innerRadius && abs(dist) < outerRadius) {
      gl_FragColor = v_color;
      return;
    }else {
      discard;
    }
  } else {
    gl_FragColor = v_color;
  }
}