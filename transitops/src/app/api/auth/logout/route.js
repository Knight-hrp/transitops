export async function POST() {
    const response = Response.json({
        success: true,
        message: "Logged out successfully",
    });

    response.headers.append(
        "Set-Cookie",
        "token=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax"
    );

    return response;
}