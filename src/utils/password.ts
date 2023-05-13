import crypto from 'crypto';

export function generate_salt(){
    const salt = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    return salt;
}
export function hash_password(password:string, salt:string){

    let password_salted_pepper = password + salt + process.env.PEPPER;
    const rounds = +(process.env.ROUNDS || 100000);
    for(let i=0; i<rounds; i++){
        const hash = crypto.createHmac('sha512',process.env!.PEPPER!);
        hash.update(password_salted_pepper);
        const value = hash.digest('hex');
        password_salted_pepper = value;
    }
    return password_salted_pepper;
}
export function verify_password(password:string, salt:string, hashed_password:string){
    const password_hashed = hash_password(password, salt);
    return password_hashed === hashed_password;
}