package com.school.sms;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.MvcResult;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class ApiIntegrationTest {

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper om;

    private JsonNode register(String name, String email, String role, int expectedStatus) throws Exception {
        String body = String.format(
                "{\"name\":\"%s\",\"email\":\"%s\",\"password\":\"secret1\",\"role\":%s}",
                name, email, role == null ? "null" : "\"" + role + "\"");
        MvcResult r = mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body))
                .andExpect(status().is(expectedStatus)).andReturn();
        return om.readTree(r.getResponse().getContentAsString());
    }

    @Test
    void fullFlow() throws Exception {
        JsonNode teacher = register("Teach", "t@x.com", "TEACHER", 201);
        JsonNode s1 = register("Alice", "alice@x.com", "STUDENT", 201);
        JsonNode s2 = register("Bob", "bob@x.com", "STUDENT", 201);
        String tt = teacher.get("token").asText();
        String st = s1.get("token").asText();

        // validation + duplicate + login failures
        register("", "bad", "STUDENT", 400);
        register("Dup", "alice@x.com", "STUDENT", 409);
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                        .content("{\"email\":\"alice@x.com\",\"password\":\"wrong\"}"))
                .andExpect(status().isUnauthorized());

        // protected route w/o token -> 401
        mvc.perform(get("/api/leaderboard")).andExpect(status().isUnauthorized());

        // find student ids from leaderboard
        MvcResult lb = mvc.perform(get("/api/leaderboard").header("Authorization", "Bearer " + st))
                .andExpect(status().isOk()).andExpect(jsonPath("$.totalElements").value(2)).andReturn();
        JsonNode content = om.readTree(lb.getResponse().getContentAsString()).get("content");
        long aliceId = 0, bobId = 0;
        for (JsonNode n : content) {
            if (n.get("name").asText().equals("Alice")) aliceId = n.get("studentId").asLong();
            else bobId = n.get("studentId").asLong();
        }

        // student cannot award -> 403
        mvc.perform(post("/api/leaderboard/" + aliceId + "/points").header("Authorization", "Bearer " + st)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"points\":10}"))
                .andExpect(status().isForbidden());

        // teacher awards: Bob 20, Alice 10 -> Bob rank 1
        mvc.perform(post("/api/leaderboard/" + bobId + "/points").header("Authorization", "Bearer " + tt)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"points\":20}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.points").value(20)).andExpect(jsonPath("$.rank").value(1));
        mvc.perform(post("/api/leaderboard/" + aliceId + "/points").header("Authorization", "Bearer " + tt)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"points\":10}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.rank").value(2));

        // negative total rejected, zero rejected, unknown student 404
        mvc.perform(post("/api/leaderboard/" + aliceId + "/points").header("Authorization", "Bearer " + tt)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"points\":-50}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/leaderboard/" + aliceId + "/points").header("Authorization", "Bearer " + tt)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"points\":0}"))
                .andExpect(status().isBadRequest());
        mvc.perform(post("/api/leaderboard/99999/points").header("Authorization", "Bearer " + tt)
                        .contentType(MediaType.APPLICATION_JSON).content("{\"points\":5}"))
                .andExpect(status().isNotFound());

        // pagination + sorting
        mvc.perform(get("/api/leaderboard?page=0&size=1").header("Authorization", "Bearer " + st))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.content.length()").value(1))
                .andExpect(jsonPath("$.content[0].name").value("Bob"))
                .andExpect(jsonPath("$.totalPages").value(2));
        mvc.perform(get("/api/leaderboard?sortBy=name&direction=asc").header("Authorization", "Bearer " + st))
                .andExpect(jsonPath("$.content[0].name").value("Alice"))
                .andExpect(jsonPath("$.content[0].rank").value(2));
        mvc.perform(get("/api/leaderboard?sortBy=password").header("Authorization", "Bearer " + st))
                .andExpect(status().isBadRequest());

        // own standing
        mvc.perform(get("/api/leaderboard/me").header("Authorization", "Bearer " + st))
                .andExpect(status().isOk()).andExpect(jsonPath("$.name").value("Alice")).andExpect(jsonPath("$.rank").value(2));
        // teacher has no student profile -> 404
        mvc.perform(get("/api/leaderboard/me").header("Authorization", "Bearer " + tt))
                .andExpect(status().isNotFound());
        assertEquals("TEACHER", teacher.get("user").get("role").asText());
    }
}
