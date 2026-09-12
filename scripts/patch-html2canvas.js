const fs = require('fs');
const path = require('path');

const oklchFunctionCode = `
var oklch = function (_context, args) {
    var tokens = args.filter(nonFunctionArgSeparator);
    var lToken = tokens[0], cToken = tokens[1], hToken = tokens[2], aToken = tokens[3];
    var l = lToken ? (lToken.type === 16 ? lToken.number / 100 : lToken.number) : 0;
    var c = cToken ? (cToken.type === 16 ? (cToken.number / 100) * 0.4 : cToken.number) : 0;
    var h = hToken ? hToken.number : 0;
    var a = typeof aToken !== 'undefined' ? (aToken.type === 16 ? aToken.number / 100 : aToken.number) : 1;

    var hRad = (h * Math.PI) / 180;
    var a_ = c * Math.cos(hRad);
    var b_ = c * Math.sin(hRad);

    var l_ = l + 0.3963377774 * a_ + 0.2158037573 * b_;
    var m_ = l - 0.1055613458 * a_ - 0.0638541728 * b_;
    var s_ = l - 0.0894841775 * a_ - 1.2914855480 * b_;

    var l3 = l_ * l_ * l_;
    var m3 = m_ * m_ * m_;
    var s3 = s_ * s_ * s_;

    var rLinear = +4.0767434770 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    var gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    var bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

    function toSrgb(val) {
        var clamped = Math.max(0, Math.min(1, val));
        return clamped <= 0.0031308
            ? Math.round(12.92 * clamped * 255)
            : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
    }

    var r = toSrgb(rLinear);
    var g = toSrgb(gLinear);
    var b = toSrgb(bLinear);
    return pack(r, g, b, a);
};
`;

const files = [
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.js'),
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.esm.js'),
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');
    if (!content.includes('oklch: oklch')) {
      content = content.replace(
        /var SUPPORTED_COLOR_FUNCTIONS = \{([\s\S]*?)\};/,
        (match, inner) => {
          return `${oklchFunctionCode}\nvar SUPPORTED_COLOR_FUNCTIONS = {${inner},\n    oklch: oklch\n};`;
        }
      );
      fs.writeFileSync(file, content, 'utf8');
      console.log('Successfully patched OKLCH support into', file);
    } else {
      console.log('File already patched:', file);
    }
  }
}
