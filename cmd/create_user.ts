import { prismaConnection } from "../src/db";
import { hash_password, generate_salt } from "../src/utils/password";
import {PermissionType} from "../src/models/Permission";
const args = process.argv;

if (args.length < 4) {
  console.error("Missing arguments");
  process.exit(1);
}

const username = args[2];
const email = args[3];
const password = args[4];

async function createUser(username:string, email:string, password:string) {
  const salt = generate_salt();
  const hashed_password = hash_password(password, salt);
  await prismaConnection.user.create({
    data: {
      username,
      password: hashed_password,
      salt,
      enabled: true,
      email,
      permission: {
        create: [
          {
            permissionId: PermissionType.SUPER_ADMIN,
          },
        ],
      },
    },
  });

  console.log("User created");

}
createUser(username, email, password).catch((e) => {
    console.error(e);
    process.exit(1);
});