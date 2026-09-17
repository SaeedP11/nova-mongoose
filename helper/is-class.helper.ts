export default function isClass(value: any): boolean {
  return (
    typeof value === 'function' &&
    /^\s*class[\s{]/.test(Function.prototype.toString.call(value))
  );
}
