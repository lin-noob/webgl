const float M_PI = 3.141592653589793;
const float SHADER_LINE_A = 1.0;
const float SHADER_LINE_B = 2.0;
const float SHADER_LINE_C = 3.0;
const float SHADER_LINE_D = 4.0;
const float SHADER_CIRCLE = 5.0;

attribute vec2 a_position;
attribute vec4 a_color;
attribute vec4 a_shaderParams;
uniform mat4 u_matrix;

varying vec2 v_position;
varying vec4 v_color;
varying vec4 v_shaderParams;
varying vec2 v_lineStart;
varying vec2 v_lineEnd;
varying vec2 v_worldPos;        // 新增：传递世界坐标位置
varying float v_halfWidth;      // 新增：传递半宽

vec2 computeCircleCoords(float mode, float vertexIndex, float radius, float lineWidth) {
  vec4 delta;
  vec4 center = vec4(a_position.xy, 0.0, 1.0);
  float pixelWidth = lineWidth;
  if(pixelWidth < 1.0) {
    pixelWidth = 1.0;
  }

  // 左边的外接圆
  if(vertexIndex == 1.0) {
    delta = vec4(-radius * sqrt(3.0), -radius, 0, 0);
  } 
  // 右边的外接圆
  else if(vertexIndex == 2.0) {
    delta = vec4(radius * sqrt(3.0), -radius, 0.0, 0.0);
  }
  // 上面的外接圆
  else if(vertexIndex == 3.0) {
    delta = vec4(0.0, 2.0 * radius, 0.0, 0.0);
  }

  vec4 pos = center + delta;
  return pos.xy;
}

void main() {
  v_color = a_color;
  gl_PointSize = 5.0;

  float mode = a_shaderParams[0];
  float width = a_shaderParams.y;
  vec2 point = a_shaderParams.zw;

  float len = length(point);
  vec2 u = (len > 0.0) ? (point / len) : vec2(0.0, 0.0);
  vec2 p = vec2(-u.y, u.x);

  v_halfWidth = width / 2.0;
  v_shaderParams = a_shaderParams;

  vec2 pos;
  if(mode == SHADER_LINE_A) {
    vec2 A_prime = a_position - v_halfWidth * u;
    pos = A_prime + v_halfWidth * p;
    v_lineStart = a_position;
    v_lineEnd = a_position + point;
    v_shaderParams[0] = SHADER_LINE_A;
  } else if(mode == SHADER_LINE_B) {
    vec2 A_prime = a_position - v_halfWidth * u;
    pos = A_prime - v_halfWidth * p;
    v_lineStart = a_position;
    v_lineEnd = a_position + point;
    v_shaderParams[0] = SHADER_LINE_A;
  } else if(mode == SHADER_LINE_C) {
    vec2 B_prime = a_position + v_halfWidth * u;
    pos = B_prime + v_halfWidth * p;
    v_lineStart = a_position - point;
    v_lineEnd = a_position;
    v_shaderParams[0] = SHADER_LINE_A;
  } else if(mode == SHADER_LINE_D) {
    vec2 B_prime = a_position + v_halfWidth * u;
    pos = B_prime - v_halfWidth * p;
    v_lineStart = a_position - point;
    v_lineEnd = a_position;
    v_shaderParams[0] = SHADER_LINE_A;
  } else if(mode == SHADER_CIRCLE) {
    v_shaderParams[0] = SHADER_CIRCLE;
    pos = computeCircleCoords(mode, a_shaderParams.y, a_shaderParams.z, a_shaderParams.w);
    v_position = a_position;
  } else {
    pos = a_position;
  }

  v_worldPos = pos;  // 保存变换前的世界坐标
  gl_Position = u_matrix * vec4(pos, 0.0, 1.0);
}