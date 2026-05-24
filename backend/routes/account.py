@router.put("/update-profile")
async def update_profile(
    email: str, 
    current_user: Account = Depends(get_current_user), 
    db: Session = Depends(get_db)
):
    # Cập nhật email vào DB
    current_user.email = email
    db.commit()
    return {"message": "Cập nhật email thành công!"}