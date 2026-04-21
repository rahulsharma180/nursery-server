import jwt from 'jsonwebtoken'

const generateResetToken = (userId, email) => {
  const resetToken = jwt.sign(
    { userId, email },
    process.env.SECRET_KEY_RESET_PASSWORD,
    { expiresIn: '5m' }
  );
  return resetToken;
}

export default generateResetToken;