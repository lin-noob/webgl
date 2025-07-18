#version 300 es
precision mediump float;

// 形状类型常量
#define SHAPE_LINE 1
#define SHAPE_CIRCLE 2
#define SHAPE_RECT 3
#define SHAPE_POLYGON 4

// 输入属性
in vec2 a_position;   // 基础位置
in vec4 a_color;      // 颜色
in vec4 a_params;     // 自定义参数
in vec4 a_texCoord;   // 纹理/控制坐标

// Uniforms
uniform mat3 u_matrix;      // 变换矩阵
uniform float u_lineWidth;  // 全局线宽
uniform float u_shapeType;  // 形状类型

// 输出到片元着色器
out vec4 v_color;
out vec2 v_texCoord;
out float v_shapeType;

// 多边形生成函数
vec2 generatePolygonVertex(vec2 center, float radius, float angle, float vertexIndex) {
  float r = radius;
  float a = angle * vertexIndex;

  return center + vec2(r * cos(a), r * sin(a));
}

void main() {
  pvec2os = a_position;
  vec4 color = a_color;
  vec2 texCoord = a_texCoord.xy;

    // 根据形状类型动态生成
  if(u_shapeType == float(SHAPE_LINE)) {
        // 线段生成
    vec2 start = a_params.xy;
    vec2 end = a_params.zw;
    vec2 lineVec = end - start;
    vec2 normal = normalize(vec2(-lineVec.y, lineVec.x));

    float width = u_lineWidth;
    vec2 offset = normal * width * 0.5f;

    if(texCoord.x > 0.5f)
      pos -= lineVec;
    pos += offset * (texCoord.y > 0.5f ? 1.0f : -1.0f);
  } else if(u_shapeType == float(SHAPE_CIRCLE)) {
        // 圆形生成
    float radius = a_params.x;
    vec2 center = a_position;

    pos = center + vec2(radius * (texCoord.x * 2.0f - 1.0f), radius * (texCoord.y * 2.0f - 1.0f));
  } else if(u_shapeType == float(SHAPE_POLYGON)) {
        // 多边形生成
    float radius = a_params.x;
    float sides = a_params.y;
    vec2 center = a_position;

    pos = generatePolygonVertex(center, radius, radians(360.0f / sides), texCoord.x);
  }

    // 应用变换矩阵
  gl_Position = vec4((u_matrix * vec3(pos, 1.0f)).xy, 0.0f, 1.0f);

    // 传递给片元着色器
  v_color = color;
  v_texCoord = texCoord;
  v_shapeType = u_shapeType;
}