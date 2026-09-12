const fs = require('fs');
const path = require('path');

const modernColorsCode = `
var toSrgb = function (val) {
    var clamped = Math.max(0, Math.min(1, val));
    return clamped <= 0.0031308
        ? Math.round(12.92 * clamped * 255)
        : Math.round((1.055 * Math.pow(clamped, 1 / 2.4) - 0.055) * 255);
};

var oklabToRgbPack = function (l, a_, b_, alpha) {
    var l_ = l + 0.3963377774 * a_ + 0.2158037573 * b_;
    var m_ = l - 0.1055613458 * a_ - 0.0638541728 * b_;
    var s_ = l - 0.0894841775 * a_ - 1.2914855480 * b_;

    var l3 = l_ * l_ * l_;
    var m3 = m_ * m_ * m_;
    var s3 = s_ * s_ * s_;

    var rLinear = +4.0767434770 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3;
    var gLinear = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3;
    var bLinear = -0.0041960863 * l3 - 0.7034186147 * m3 + 1.7076147010 * s3;

    return pack(toSrgb(rLinear), toSrgb(gLinear), toSrgb(bLinear), alpha);
};

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
    return oklabToRgbPack(l, a_, b_, a);
};

var oklab = function (_context, args) {
    var tokens = args.filter(nonFunctionArgSeparator);
    var lToken = tokens[0], aToken = tokens[1], bToken = tokens[2], alphaToken = tokens[3];
    var l = lToken ? (lToken.type === 16 ? lToken.number / 100 : lToken.number) : 0;
    var a_ = aToken ? (aToken.type === 16 ? (aToken.number / 100) * 0.4 : aToken.number) : 0;
    var b_ = bToken ? (bToken.type === 16 ? (bToken.number / 100) * 0.4 : bToken.number) : 0;
    var alpha = typeof alphaToken !== 'undefined' ? (alphaToken.type === 16 ? alphaToken.number / 100 : alphaToken.number) : 1;
    return oklabToRgbPack(l, a_, b_, alpha);
};

var lab = function (_context, args) {
    var tokens = args.filter(nonFunctionArgSeparator);
    var lToken = tokens[0], aToken = tokens[1], bToken = tokens[2], alphaToken = tokens[3];
    var l = lToken ? lToken.number : 0;
    var a_ = aToken ? aToken.number : 0;
    var b_ = bToken ? bToken.number : 0;
    var alpha = typeof alphaToken !== 'undefined' ? (alphaToken.type === 16 ? alphaToken.number / 100 : alphaToken.number) : 1;

    // Approximate LAB to sRGB
    var y = (l + 16) / 116;
    var x = a_ / 500 + y;
    var z = y - b_ / 200;
    var f = function (t) { return t * t * t > 0.008856 ? t * t * t : (t - 16 / 116) / 7.787; };
    var X = 0.95047 * f(x);
    var Y = 1.00000 * f(y);
    var Z = 1.08883 * f(z);

    var rLinear = 3.2406 * X - 1.5372 * Y - 0.4986 * Z;
    var gLinear = -0.9689 * X + 1.8758 * Y + 0.0415 * Z;
    var bLinear = 0.0557 * X - 0.2040 * Y + 1.0570 * Z;
    return pack(toSrgb(rLinear), toSrgb(gLinear), toSrgb(bLinear), alpha);
};

var lch = function (context, args) {
    var tokens = args.filter(nonFunctionArgSeparator);
    var lToken = tokens[0], cToken = tokens[1], hToken = tokens[2], alphaToken = tokens[3];
    var l = lToken ? lToken.number : 0;
    var c = cToken ? cToken.number : 0;
    var h = hToken ? hToken.number : 0;
    var alpha = typeof alphaToken !== 'undefined' ? (alphaToken.type === 16 ? alphaToken.number / 100 : alphaToken.number) : 1;

    var hRad = (h * Math.PI) / 180;
    var a_ = c * Math.cos(hRad);
    var b_ = c * Math.sin(hRad);
    return lab(context, [{ number: l, type: 17 }, { number: a_, type: 17 }, { number: b_, type: 17 }, { number: alpha, type: 17 }]);
};

var colorFunc = function (_context, args) {
    var tokens = args.filter(nonFunctionArgSeparator);
    var numTokens = tokens.filter(function(t) { return t.type === 17 || t.type === 16; });
    var r = numTokens[0] ? (numTokens[0].type === 16 ? numTokens[0].number * 2.55 : numTokens[0].number * 255) : 0;
    var g = numTokens[1] ? (numTokens[1].type === 16 ? numTokens[1].number * 2.55 : numTokens[1].number * 255) : 0;
    var b = numTokens[2] ? (numTokens[2].type === 16 ? numTokens[2].number * 2.55 : numTokens[2].number * 255) : 0;
    var a = numTokens[3] ? (numTokens[3].type === 16 ? numTokens[3].number / 100 : numTokens[3].number) : 1;
    return pack(Math.round(r), Math.round(g), Math.round(b), a);
};
`;

const files = [
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.js'),
  path.join(__dirname, '../node_modules/html2canvas/dist/html2canvas.esm.js'),
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf8');

    // 1. Reset any old patches if needed
    content = content.replace(/var toSrgb = function[\s\S]*?SUPPORTED_COLOR_FUNCTIONS = \{[\s\S]*?\};/, 'var SUPPORTED_COLOR_FUNCTIONS = {\n    hsl: hsl,\n    hsla: hsl,\n    rgb: rgb,\n    rgba: rgb\n};');
    content = content.replace(/var oklch = function[\s\S]*?SUPPORTED_COLOR_FUNCTIONS = \{[\s\S]*?\};/, 'var SUPPORTED_COLOR_FUNCTIONS = {\n    hsl: hsl,\n    hsla: hsl,\n    rgb: rgb,\n    rgba: rgb\n};');

    // 2. Inject modern color definitions (oklch, oklab, lab, lch, color)
    content = content.replace(
      /var SUPPORTED_COLOR_FUNCTIONS = \{([\s\S]*?)\};/,
      (match, inner) => {
        return `${modernColorsCode}\nvar SUPPORTED_COLOR_FUNCTIONS = {${inner},\n    oklch: oklch,\n    oklab: oklab,\n    lab: lab,\n    lch: lch,\n    color: colorFunc\n};`;
      }
    );

    // 3. Safe fallback: Replace throwing error with return 0 (transparent) so it NEVER crashes
    content = content.replace(
      /throw new Error\("Attempting to parse an unsupported color function \\"" \+ value\.name \+ "\\""\);/g,
      "return 0;"
    );

    fs.writeFileSync(file, content, 'utf8');
    console.log('Successfully applied color patch and zero-crash fallback to', file);
  }
}
