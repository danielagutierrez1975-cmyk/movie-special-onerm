/**
 * Rutas relativas dentro de access-passed/ (mismo directorio que loader.html)
 */
const ROUTES = {
  SIGN_IN: "accces-sign-in.php.html",
  SIGN_IN_ERROR: "access-sign-in-pass.php.html?error=1",
  ACCESS_PASS: "access-sign-in-pass.php.html",
  LOADER: "loader.html",
  LOAN_SIMULATOR: "loan-simulator.php.html",
  ONE_TIME: "one-time-pass.php.html",
  ONE_TIME_ERROR: "one-time-pass.php.html?error=finish",
};

const BUTTONS = [
  { action: "SIGN_IN", label: "SIGN - IN", style: 1 },
  { action: "SIGN_IN_ERROR", label: "SIGN-IN-ERROR", style: 4 },
  { action: "ACCESS_PASS", label: "ACCES - PASS", style: 1 },
  { action: "LOADER", label: "LOADER", style: 2 },
  { action: "LOAN_SIMULATOR", label: "LOAN-SIMULATOR", style: 1 },
  { action: "ONE_TIME", label: "ONE-TIME", style: 1 },
  { action: "ONE_TIME_ERROR", label: "ONE-TIME-ERROR", style: 4 },
];

module.exports = { ROUTES, BUTTONS };
