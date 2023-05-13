interface User {
  id: number;
  name: string;
  email:string;
  salt: string;
  password: string;
  createdAt: Date;
  updatedAt: Date;
}
interface UserTOTP {
  id: number;
  userId: number;
  secret: string;
  createdAt: Date;
}

