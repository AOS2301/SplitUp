import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import { UserRepository } from "../repositories/UserRepository.js";
//import { UserDTO } from "../dto/UserDto.js";


export class AuthService {
  static async login(email, senha) {
    /*const user = await UserRepository.findByEmail(email);

    if (!user) {
      throw new Error("Usuário não encontrado");
    }

    const senhaValida = await bcrypt.compare(senha, user.senha);

    if (!senhaValida) {
      throw new Error("Senha inválida");
    }
    
    const token = jwt.sign(
      {
        id: user.id,
        email: user.email
      },
      process.env.JWT_SECRET,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || "1d"
      }
    );

    return {
      token,
      user: new UserDTO(user),
    };*/
  }
}