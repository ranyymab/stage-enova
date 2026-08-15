package com.enovarobotics.pguard.model.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class MessageResponse {
    private String message;

    private String devCode;

    public static MessageResponse of(String message) {
        return new MessageResponse(message, null);
    }

    public static MessageResponse of(String message, String devCode) {
        return new MessageResponse(message, devCode);
    }
}
