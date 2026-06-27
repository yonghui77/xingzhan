const fs = require("fs");
const path = require("path");
const sharp = require("sharp");

const sourceRoot = "C:\\Users\\Administrator\\.codex\\generated_images\\019efcb0-f900-7950-a9fb-8393e7cb91e4";
const targetRoot = path.resolve(__dirname, "..", "assets", "market");
const assets = {
  ore: "call_6RKivtTGkFd1MIeY4eV8XkSj.png",
  crystal: "call_cP8pimcBHWy1ZPxDerDof9sz.png",
  salvage: "call_FAbzN9j903xJU9yzyZMJju6e.png",
  fuel: "call_w6fsCa3itEsh2ko7WO0wDG4b.png",
  ammo: "call_GHl7ShkeQt5ThXDaHfOMFIG1.png",
  alloy: "call_bVMkulxfnt21NAdR0Oe5jjSP.png",
  ceramic: "call_2NDQrtMVh0H7QuL50HrSvQeY.png",
  superconductor: "call_BPVMeqq1tjZM27aK1Qz9oQ6b.png",
  lens: "call_3d4PBmv0mRzhdlWXNBioY7dW.png",
  capacitor: "call_1wVFj8UspIpHUxUWXd5cSiyq.png",
  guidance: "call_BNLkWx5bIGiTZqnLlQJGk4Sy.png"
};

(async () => {
  fs.mkdirSync(targetRoot, { recursive: true });
  for (const [name, filename] of Object.entries(assets)) {
    const input = path.join(sourceRoot, filename);
    const output = path.join(targetRoot, `${name}.webp`);
    await sharp(input)
      .resize(384, 384, { fit: "cover" })
      .webp({ quality: 82, effort: 5 })
      .toFile(output);
  }
  const result = Object.keys(assets).map(name => {
    const filename = path.join(targetRoot, `${name}.webp`);
    return { name, bytes: fs.statSync(filename).size };
  });
  console.log(JSON.stringify({ targetRoot, assets: result }));
})().catch(error => {
  console.error(error);
  process.exit(1);
});
