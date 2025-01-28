export interface LoginUserDto {
    email: string;
    password: string;
}

export interface RegisterUserDto {
    name: string;
    password: string;
    email: string;
}

export interface TokenResponseDto {
    access_token: string;
    refresh_token: string;
}

export interface User {
    email: string;
}