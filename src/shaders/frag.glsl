#version 300 es
precision mediump float;

in vec4 v_color;
in vec2 v_texCoord;
in float v_shapeType;

out vec4 outColor;

void main() {
    // 圆形和多边形的裁剪
  if(v_shapeType == 2.0f) {  // Circle
    float dist = length(v_texCoord * 2.0f - 1.0f);
    if(dist > 1.0f)
      discard;
  }

  outColor = v_color;
}