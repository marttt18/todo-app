import jwt from 'jsonwebtoken';

const generateToken = (payload) => {
    return jwt.sign(payload, process.env.JWT_SECRET_KEY, { expiresIn: '1hr' });
}
// Q: is the payload must be an object?
// A: Yes, the payload must be an object. It can contain any information you want to include in the token, such as user ID, email, roles, etc.
// Q: Since we have only one parameter which is the payload, and if we want to pass not jjust the id but also the email, how do we do that?
// A: We can pass an object as the payload. For example: generateToken({ id: user._id, email: user.email });
export default generateToken;