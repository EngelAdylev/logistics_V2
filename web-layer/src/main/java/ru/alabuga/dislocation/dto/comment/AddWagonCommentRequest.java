package ru.alabuga.dislocation.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddWagonCommentRequest {
    // Автор берётся из токена (кто вошёл), клиент передаёт только текст
    @NotBlank
    @Size(max = 2000)
    private String body;
}
