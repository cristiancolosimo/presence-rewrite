export function get_pwd(){
    return process.cwd();
}
export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
