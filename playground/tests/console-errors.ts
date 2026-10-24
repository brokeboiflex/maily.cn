/**
 * Console errors that are expected outside Maily's code: the sandboxed email
 * preview correctly refuses to run authored scripts.
 */
export function isExpectedConsoleError(text: string) {
  return (
    text.startsWith("Blocked script execution in 'about:srcdoc'") &&
    text.includes("'allow-scripts' permission is not set")
  )
}
