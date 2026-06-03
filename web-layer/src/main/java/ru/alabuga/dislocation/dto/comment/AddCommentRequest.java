package ru.alabuga.dislocation.dto.comment;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.Data;

@Data
public class AddCommentRequest {
    @NotBlank
    @Size(max = 100)
    private String author;

    @NotBlank
    @Size(max = 2000)
    private String body;
}
