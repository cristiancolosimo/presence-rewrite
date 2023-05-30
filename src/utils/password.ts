function sha512(str:string) {
    return crypto.subtle.digest("SHA-512", new TextEncoder().encode(str)).then(buf => {
      return Array.prototype.map.call(new Uint8Array(buf), x=>(('00'+x.toString(16)).slice(-2))).join('');
    });
  }
  

export function generate_salt(){
    const salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return salt;
}
export async function hash_password(password:string, salt:string){

    let password_salted_pepper = password + salt + Deno.env.get("PEPPER")!;
    const rounds = +(Deno.env.get("ROUNDS") || 100000);
    for(let i=0; i<rounds; i++){
        const COUNT = i.toString();
        password_salted_pepper = await sha512(password_salted_pepper+COUNT);
    }
    return password_salted_pepper;
}
export async function verify_password(password:string, salt:string, hashed_password:string){
    const password_hashed = await hash_password(password, salt);
    return password_hashed === hashed_password;
}