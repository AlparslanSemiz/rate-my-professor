package com.pse.moderation.service;


import com.pse.shared.dto.BasicResponse;
import com.pse.moderation.repository.AdminRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AdminService {

    private final ModerationUserService moderationUserService;



    public AdminService(ModerationUserService moderationUserService) {
        this.moderationUserService = moderationUserService;
    }

    public BasicResponse validateAdmin(String authHeader) {

        if(moderationUserService.validateAdminToken(authHeader)){
            return new BasicResponse("Is Admin", true);
        }

        return new BasicResponse("Is Not Admin", false);

    }

}
