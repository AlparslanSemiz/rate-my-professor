package com.pse;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.beans.factory.annotation.Autowired;


/**
 * ONLY TESTING PURPOSES DELETE AFTER
 */
@RestController
public class TestController {

    @Autowired
    private MailService mailService;


    @GetMapping("/hello")
    public String hello() {
        return "Hello Backend";
    }

    
     @GetMapping("/testmail")
    public String testMail() {

        mailService.sendLoginMail(
                "luis@example.org",
                "123456"
        );

        return "Mail sent";
    }




}