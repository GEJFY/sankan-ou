"""認証エンドポイント"""

from fastapi import APIRouter, HTTPException, status
from sqlalchemy import select

from src.deps import CurrentUser, DbSession
from src.models.user import User
from src.schemas.auth import ChangePasswordRequest, LoginRequest, RegisterRequest, TokenResponse, UserOut
from src.services.auth_service import (
    authenticate_user,
    create_access_token,
    hash_password,
    verify_password,
)

router = APIRouter(prefix="/auth", tags=["auth"])


@router.post("/register", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def register(body: RegisterRequest, db: DbSession) -> UserOut:
    """ユーザー登録"""
    # 重複チェック
    existing = await db.execute(select(User).where(User.email == body.email))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="このメールアドレスは既に登録されています")

    user = User(
        email=body.email,
        hashed_password=hash_password(body.password),
        display_name=body.display_name,
    )
    db.add(user)
    await db.flush()
    return UserOut.model_validate(user)


@router.post("/login", response_model=TokenResponse)
async def login(body: LoginRequest, db: DbSession) -> TokenResponse:
    """ログイン → JWTトークン発行"""
    user = await authenticate_user(db, body.email, body.password)
    if not user:
        raise HTTPException(status_code=401, detail="メールアドレスまたはパスワードが正しくありません")

    token = create_access_token(str(user.id))
    return TokenResponse(access_token=token)


@router.put("/password")
async def change_password(body: ChangePasswordRequest, db: DbSession, current_user: CurrentUser):
    """パスワード変更"""
    if not verify_password(body.current_password, current_user.hashed_password):
        raise HTTPException(status_code=400, detail="現在のパスワードが正しくありません")

    current_user.hashed_password = hash_password(body.new_password)
    await db.flush()
    return {"message": "パスワードを変更しました"}


@router.get("/me", response_model=UserOut)
async def get_me(current_user: CurrentUser) -> UserOut:
    """現在のユーザー情報取得（トークン検証）"""
    return UserOut.model_validate(current_user)
