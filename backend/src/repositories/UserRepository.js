export class UserRepository {
  static async findByEmail(email) {
    //Usado no login para verificar se o email existe
    const user = await prisma.usuario.findUnique({
      where: { email },
    });

    return user;
  }

  static async create({ nome, email, senha }) {
    //Este é o cadastro
    const user = await prisma.usuario.create({
      data: {
        nome,
        email,
        senha,
      },
    });

    return user;
  }
}