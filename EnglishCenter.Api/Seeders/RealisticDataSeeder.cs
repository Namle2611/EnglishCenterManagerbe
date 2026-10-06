using EnglishCenter.Api.Data;
using EnglishCenter.Api.Entities;
using EnglishCenter.Api.Enums;
using EnglishCenter.Api.Security;
using Microsoft.EntityFrameworkCore;

namespace EnglishCenter.Api.Seeders;

public static class RealisticDataSeeder
{
    public static async Task ResetAndSeedRealisticDataAsync(
        AppDbContext context,
        IPasswordHasherService passwordHasher,
        string adminEmail = "admincenter@gmail.com")
    {
        context.Database.SetCommandTimeout(180);

        // 1. Identify Admin User
        var adminUser = await context.Users
            .Include(u => u.UserRoles)
            .FirstOrDefaultAsync(u => u.Email.ToLower() == adminEmail.ToLower());

        if (adminUser == null)
        {
            var adminRole = await context.Roles.FirstOrDefaultAsync(r => r.Name == RoleNames.Admin);
            if (adminRole == null)
            {
                adminRole = new Role { Name = RoleNames.Admin, Description = "Administrator role" };
                context.Roles.Add(adminRole);
                await context.SaveChangesAsync();
            }

            adminUser = new User
            {
                Email = adminEmail,
                FullName = "System Administrator",
                IsActive = true,
                CreatedAt = DateTime.UtcNow
            };
            adminUser.PasswordHash = passwordHasher.HashPassword(adminUser, "admin123456");
            context.Users.Add(adminUser);
            await context.SaveChangesAsync();

            context.UserRoles.Add(new UserRole { UserId = adminUser.Id, RoleId = adminRole.Id });
            await context.SaveChangesAsync();
        }

        int adminId = adminUser.Id;

        // 2. Wipe all existing test data while strictly preserving Admin account
        await context.Database.ExecuteSqlRawAsync(@"
            DELETE FROM [Notifications];
            DELETE FROM [Grades];
            DELETE FROM [QuizAnswers];
            DELETE FROM [QuizAttempts];
            DELETE FROM [QuestionOptions];
            DELETE FROM [Questions];
            DELETE FROM [Quizzes];
            DELETE FROM [Submissions];
            DELETE FROM [Assignments];
            DELETE FROM [Lessons];
            DELETE FROM [Sections];
            DELETE FROM [AttendanceRecords];
            DELETE FROM [AttendanceSessions];
            DELETE FROM [Payments];
            DELETE FROM [ClassStudents];
            DELETE FROM [Enrollments];
            DELETE FROM [Schedules];
            DELETE FROM [Classes];
            DELETE FROM [Rooms];
            DELETE FROM [Courses];
            DELETE FROM [Students];
            DELETE FROM [Teachers];
            DELETE FROM [RefreshTokens];
        ");

        await context.Database.ExecuteSqlRawAsync(@"
            DELETE FROM [UserRoles] WHERE [UserId] <> {0};
            DELETE FROM [Users] WHERE [Id] <> {0};
        ", adminId);

        // 3. Ensure all 4 Roles exist
        var roles = new Dictionary<string, Role>();
        foreach (var roleName in RoleNames.AllRoles)
        {
            var role = await context.Roles.FirstOrDefaultAsync(r => r.Name == roleName);
            if (role == null)
            {
                role = new Role { Name = roleName, Description = $"{roleName} role" };
                context.Roles.Add(role);
                await context.SaveChangesAsync();
            }
            roles[roleName] = role;
        }

        var adminRoleObj = roles[RoleNames.Admin];
        if (!await context.UserRoles.AnyAsync(ur => ur.UserId == adminId && ur.RoleId == adminRoleObj.Id))
        {
            context.UserRoles.Add(new UserRole { UserId = adminId, RoleId = adminRoleObj.Id });
            await context.SaveChangesAsync();
        }

        var staffRoleObj = roles[RoleNames.Staff];
        var teacherRoleObj = roles[RoleNames.Teacher];
        var studentRoleObj = roles[RoleNames.Student];

        // 4. Seed 10 Realistic Staff Users
        var staffData = new[]
        {
            ("staff01@gmail.com", "Nguyễn Thị Mai Anh", "0901234501"),
            ("staff02@gmail.com", "Trần Minh Tuấn", "0901234502"),
            ("staff03@gmail.com", "Lê Hoàng Yến", "0901234503"),
            ("staff04@gmail.com", "Phạm Quốc Bảo", "0901234504"),
            ("staff05@gmail.com", "Vũ Thùy Linh", "0901234505"),
            ("staff06@gmail.com", "Hoàng Minh Đức", "0901234506"),
            ("staff07@gmail.com", "Đỗ Khánh Huyền", "0901234507"),
            ("staff08@gmail.com", "Bùi Văn Nam", "0901234508"),
            ("staff09@gmail.com", "Đinh Thu Trang", "0901234509"),
            ("staff10@gmail.com", "Ngô Quốc Huy", "0901234510")
        };

        foreach (var (email, name, phone) in staffData)
        {
            var user = new User
            {
                Email = email,
                FullName = name,
                Phone = phone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddMonths(-6)
            };
            user.PasswordHash = passwordHasher.HashPassword(user, "staff123456");
            user.UserRoles.Add(new UserRole { RoleId = staffRoleObj.Id });
            context.Users.Add(user);
        }

        // 5. Seed 10 Realistic Teacher Users & Teachers
        var teacherList = new List<Teacher>();
        var teacherData = new[]
        {
            ("teacher01@gmail.com", "ThS. Đặng Thị Kim Ngân", "0912345601", "TCH001", "IELTS & Academic Writing", "Thạc sĩ TESOL - ĐH Victoria, IELTS 8.5", 8, new DateTime(2020, 1, 15)),
            ("teacher02@gmail.com", "ThS. Nguyễn Hoàng Long", "0912345602", "TCH002", "IELTS Speaking & Phản Xạ", "Thạc sĩ Ngôn ngữ Anh - ĐH Sư Phạm, IELTS 8.5", 6, new DateTime(2021, 3, 10)),
            ("teacher03@gmail.com", "Cô Vũ Phương Thảo", "0912345603", "TCH003", "Tiếng Anh Giao Tiếp & Phát Âm", "Cử nhân Sư phạm Anh - ĐHQG, TOEIC 990", 5, new DateTime(2022, 6, 1)),
            ("teacher04@gmail.com", "Thầy David Miller", "0912345604", "TCH004", "Business English & Negotiation", "Cử nhân Văn học - ĐH Melbourne, CELTA", 7, new DateTime(2021, 9, 15)),
            ("teacher05@gmail.com", "Cô Lê Bảo Trâm", "0912345605", "TCH005", "Ngữ Pháp & Đọc Hiểu Học Thuật", "Thạc sĩ Giảng dạy Tiếng Anh - ĐH Sheffield, IELTS 8.0", 4, new DateTime(2023, 2, 20)),
            ("teacher06@gmail.com", "Thầy Phan Trọng Nghĩa", "0912345606", "TCH006", "TOEIC 4 Kỹ Năng & Luyện Đề", "Cử nhân Ngoại thương, TOEIC 985, IELTS 8.0", 5, new DateTime(2022, 8, 15)),
            ("teacher07@gmail.com", "ThS. Trương Ngọc Hà", "0912345607", "TCH007", "IELTS Writing & Đánh Giá Năng Lực", "Thạc sĩ Ngôn ngữ Ứng dụng - ĐH Curtin, IELTS 8.5", 9, new DateTime(2019, 11, 1)),
            ("teacher08@gmail.com", "Cô Hoàng Yến Nhi", "0912345608", "TCH008", "Tiếng Anh Trẻ Em & Cambridge", "Cử nhân Sư phạm Tiếng Anh, CELTA", 4, new DateTime(2023, 5, 10)),
            ("teacher09@gmail.com", "Thầy Michael Foster", "0912345609", "TCH009", "Pronunciation Master & Fluency", "Cử nhân Giáo dục - ĐH Leeds, TEFL", 6, new DateTime(2022, 1, 10)),
            ("teacher10@gmail.com", "Cô Trần Bích Ngọc", "0912345610", "TCH010", "Luyện Thi TOEIC Cấp Tốc & Ngữ Pháp", "Cử nhân Ngoại ngữ - ĐH Hà Nội, TOEIC 980", 5, new DateTime(2022, 10, 1))
        };

        foreach (var (email, name, phone, code, spec, qual, exp, hire) in teacherData)
        {
            var user = new User
            {
                Email = email,
                FullName = name,
                Phone = phone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddMonths(-12)
            };
            user.PasswordHash = passwordHasher.HashPassword(user, "teacher123456");
            user.UserRoles.Add(new UserRole { RoleId = teacherRoleObj.Id });

            var teacher = new Teacher
            {
                User = user,
                TeacherCode = code,
                Specialization = spec,
                Qualification = qual,
                ExperienceYears = exp,
                HireDate = hire,
                Status = TeacherStatus.Active
            };
            context.Teachers.Add(teacher);
            teacherList.Add(teacher);
        }

        // 6. Seed 10 Realistic Student Users & Students
        var studentList = new List<Student>();
        var studentData = new[]
        {
            ("student01@gmail.com", "Nguyễn Hải Đăng", "0987654301", "STU001", new DateTime(2004, 5, 12), "Nam", "Cầu Giấy, Hà Nội", "B1", new DateTime(2026, 1, 10)),
            ("student02@gmail.com", "Lê Quỳnh Chi", "0987654302", "STU002", new DateTime(2005, 8, 20), "Nữ", "Quận 1, TP. Hồ Chí Minh", "B2", new DateTime(2026, 1, 15)),
            ("student03@gmail.com", "Trần Quang Huy", "0987654303", "STU003", new DateTime(2003, 11, 5), "Nam", "Hải Châu, Đà Nẵng", "A2", new DateTime(2026, 2, 1)),
            ("student04@gmail.com", "Phạm Minh Châu", "0987654304", "STU004", new DateTime(2004, 3, 18), "Nữ", "Ninh Kiều, Cần Thơ", "B1", new DateTime(2026, 2, 10)),
            ("student05@gmail.com", "Hoàng Phương Linh", "0987654305", "STU005", new DateTime(2006, 9, 25), "Nữ", "Ngô Quyền, Hải Phòng", "A1", new DateTime(2026, 2, 15)),
            ("student06@gmail.com", "Đỗ Tuấn Kiệt", "0987654306", "STU006", new DateTime(2002, 12, 30), "Nam", "Nha Trang, Khánh Hòa", "B2", new DateTime(2026, 3, 1)),
            ("student07@gmail.com", "Vũ Thu Phương", "0987654307", "STU007", new DateTime(2005, 7, 14), "Nữ", "Hạ Long, Quảng Ninh", "B1", new DateTime(2026, 3, 5)),
            ("student08@gmail.com", "Bùi Đức Anh", "0987654308", "STU008", new DateTime(2004, 1, 22), "Nam", "Thủ Dầu Một, Bình Dương", "A2", new DateTime(2026, 3, 10)),
            ("student09@gmail.com", "Ngô Mỹ Duyên", "0987654309", "STU009", new DateTime(2003, 10, 9), "Nữ", "TP. Huế, Thừa Thiên Huế", "B2", new DateTime(2026, 3, 15)),
            ("student10@gmail.com", "Dương Gia Bảo", "0987654310", "STU010", new DateTime(2006, 4, 3), "Nam", "TP. Vũng Tàu, Bà Rịa - Vũng Tàu", "A1", new DateTime(2026, 3, 20))
        };

        foreach (var (email, name, phone, code, dob, gender, address, level, enrollDate) in studentData)
        {
            var user = new User
            {
                Email = email,
                FullName = name,
                Phone = phone,
                IsActive = true,
                CreatedAt = DateTime.UtcNow.AddMonths(-6)
            };
            user.PasswordHash = passwordHasher.HashPassword(user, "student123456");
            user.UserRoles.Add(new UserRole { RoleId = studentRoleObj.Id });

            var student = new Student
            {
                User = user,
                StudentCode = code,
                DateOfBirth = dob,
                Gender = gender,
                Address = address,
                CurrentLevel = level,
                EnrollmentDate = enrollDate,
                Status = StudentStatus.Active
            };
            context.Students.Add(student);
            studentList.Add(student);
        }

        // 7. Seed 10 Realistic Courses
        var courseList = new List<Course>();
        var courseData = new[]
        {
            ("CRS001", "Tiếng Anh Giao Tiếp Căn Bản (Starter A1)", "Khóa học nền tảng giúp người mới bắt đầu phát triển phản xạ phát âm chuẩn, từ vựng đời sống và tự tin giới thiệu bản thân.", "A1", 3, 3500000m),
            ("CRS002", "Tiếng Anh Giao Tiếp Thực Chiến (Elementary A2)", "Rèn luyện kỹ năng nghe nói theo ngữ cảnh hàng ngày, công việc, mua sắm và du lịch với tình huống thực tế.", "A2", 3, 4200000m),
            ("CRS003", "Tiếng Anh Giao Tiếp Phản Xạ Nâng Cao (Intermediate B1)", "Nâng cao năng lực đàm luận, diễn đạt ý kiến phức tạp và thuyết trình tự tin trong môi trường học thuật.", "B1", 3, 4800000m),
            ("CRS004", "Luyện Thi IELTS Foundation 4.5 - 5.5", "Trang bị phương pháp làm bài chuẩn xác 4 kỹ năng Nghe - Nói - Đọc - Viết, xây dựng vốn từ vựng học thuật chuyên sâu.", "B1", 4, 6500000m),
            ("CRS005", "Luyện Thi IELTS Intensive 6.5 - 7.5+", "Khóa học chuyên sâu rèn luyện tư duy phản biện Task 2 Writing, chiến thuật giải đề Speaking Part 2-3.", "B2", 4, 8500000m),
            ("CRS006", "Luyện Thi TOEIC Mục Tiêu 550+", "Chiến thuật xử lý nhanh 7 phần thi TOEIC Listening & Reading, nắm vững 600 từ vựng cốt lõi và mẹo ngữ pháp.", "A2-B1", 3, 3800000m),
            ("CRS007", "Luyện Thi TOEIC Chuyên Sâu 750+", "Nâng cao tốc độ đọc hiểu văn bản kinh doanh phức tạp, xử lý bẫy phát âm người bản xứ và giải đề chuẩn ETS.", "B1-B2", 3, 4500000m),
            ("CRS008", "Tiếng Anh Thương Mại & Thuyết Trình (Business English)", "Kỹ năng viết email chuyên nghiệp, đàm phán hợp đồng, thuyết trình dự án và giao tiếp công sở chuẩn quốc tế.", "B1-B2", 3, 5500000m),
            ("CRS009", "Luyện Phát Âm Chuẩn Quốc Tế & Ngữ Điệu (Pronunciation Master)", "Nắm vững bảng phiên âm IPA 44 âm, kỹ thuật nối âm, nuốt âm, trọng âm từ và ngữ điệu tự nhiên.", "All Levels", 2, 2800000m),
            ("CRS010", "Tiếng Anh Trẻ Em & Thiếu Nhi (Cambridge Young Learners)", "Chương trình tương tác sinh động chuẩn Cambridge Starters/Movers, giúp học sinh phát triển niềm yêu thích tiếng Anh.", "Starters", 4, 5000000m)
        };

        foreach (var (code, name, desc, level, duration, fee) in courseData)
        {
            var course = new Course
            {
                CourseCode = code,
                CourseName = name,
                Description = desc,
                Level = level,
                DurationMonths = duration,
                TuitionFee = fee,
                Status = CourseStatus.Active
            };
            context.Courses.Add(course);
            courseList.Add(course);
        }

        // 8. Seed 10 Realistic Rooms
        var roomList = new List<Room>();
        var roomData = new[]
        {
            ("LAB101", "Phòng Lab Đa Phương Tiện A", 25, RoomStatus.Active),
            ("LAB102", "Phòng Lab Đa Phương Tiện B", 25, RoomStatus.Active),
            ("R201", "Phòng Học Tiêu Chuẩn Oxford", 20, RoomStatus.Active),
            ("R202", "Phòng Học Tiêu Chuẩn Cambridge", 20, RoomStatus.Active),
            ("R203", "Phòng Học Giao Tiếp Nhóm Harvard", 15, RoomStatus.Active),
            ("R204", "Phòng Học Thuyết Trình Stanford", 18, RoomStatus.Active),
            ("R301", "Phòng Hội Thảo Quốc Tế Hall A", 40, RoomStatus.Active),
            ("R302", "Phòng Luyện Thi IELTS VIP", 12, RoomStatus.Active),
            ("R303", "Phòng Học Thiếu Nhi Kindergarten", 15, RoomStatus.Active),
            ("R304", "Phòng Tự Học & Thư Viện Self-Study", 30, RoomStatus.Active)
        };

        foreach (var (code, name, cap, status) in roomData)
        {
            var room = new Room
            {
                RoomCode = code,
                RoomName = name,
                Capacity = cap,
                Status = status
            };
            context.Rooms.Add(room);
            roomList.Add(room);
        }

        // Commit Users, Teachers, Students, Courses, Rooms first
        await context.SaveChangesAsync();

        // 9. Seed 10 Realistic Classes
        var classList = new List<CourseClass>();
        var classData = new[]
        {
            ("CLS-IELTS-01", 4, 0, new DateTime(2026, 9, 1), new DateTime(2026, 12, 31), 15, ClassStatus.Ongoing), // CRS005 (TCH001)
            ("CLS-IELTS-02", 3, 1, new DateTime(2026, 9, 15), new DateTime(2027, 1, 15), 15, ClassStatus.Ongoing), // CRS004 (TCH002)
            ("CLS-COMM-01", 2, 2, new DateTime(2026, 9, 10), new DateTime(2026, 12, 10), 18, ClassStatus.Ongoing), // CRS003 (TCH003)
            ("CLS-COMM-02", 0, 3, new DateTime(2026, 9, 5), new DateTime(2026, 12, 5), 20, ClassStatus.Ongoing),   // CRS001 (TCH004)
            ("CLS-COMM-03", 1, 4, new DateTime(2026, 10, 15), new DateTime(2027, 1, 15), 18, ClassStatus.Planned),  // CRS002 (TCH005)
            ("CLS-TOEIC-01", 5, 5, new DateTime(2026, 9, 20), new DateTime(2026, 12, 20), 20, ClassStatus.Ongoing), // CRS006 (TCH006)
            ("CLS-TOEIC-02", 6, 9, new DateTime(2026, 9, 25), new DateTime(2026, 12, 25), 15, ClassStatus.Ongoing), // CRS007 (TCH010)
            ("CLS-BIZ-01", 7, 6, new DateTime(2026, 10, 20), new DateTime(2027, 1, 20), 15, ClassStatus.Planned),   // CRS008 (TCH007)
            ("CLS-PRON-01", 8, 8, new DateTime(2026, 9, 6), new DateTime(2026, 11, 6), 15, ClassStatus.Ongoing),    // CRS009 (TCH009)
            ("CLS-KIDS-01", 9, 7, new DateTime(2026, 9, 8), new DateTime(2027, 1, 8), 12, ClassStatus.Ongoing)      // CRS010 (TCH008)
        };

        foreach (var (code, cIdx, tIdx, start, end, max, status) in classData)
        {
            var courseClass = new CourseClass
            {
                ClassCode = code,
                CourseId = courseList[cIdx].Id,
                TeacherId = teacherList[tIdx].Id,
                StartDate = start,
                EndDate = end,
                MaxStudents = max,
                Status = status
            };
            context.Classes.Add(courseClass);
            classList.Add(courseClass);
        }
        await context.SaveChangesAsync();

        // 10. Seed 10 Realistic Schedules
        var scheduleData = new[]
        {
            (0, 7, 1, new TimeSpan(18, 0, 0), new TimeSpan(19, 30, 0)),
            (0, 7, 3, new TimeSpan(18, 0, 0), new TimeSpan(19, 30, 0)),
            (1, 2, 2, new TimeSpan(19, 45, 0), new TimeSpan(21, 15, 0)),
            (2, 4, 4, new TimeSpan(18, 0, 0), new TimeSpan(19, 30, 0)),
            (3, 3, 5, new TimeSpan(19, 45, 0), new TimeSpan(21, 15, 0)),
            (4, 5, 6, new TimeSpan(9, 0, 0), new TimeSpan(10, 30, 0)),
            (5, 0, 1, new TimeSpan(19, 45, 0), new TimeSpan(21, 15, 0)),
            (6, 1, 3, new TimeSpan(19, 45, 0), new TimeSpan(21, 15, 0)),
            (8, 5, 7, new TimeSpan(14, 0, 0), new TimeSpan(15, 30, 0)),
            (9, 8, 6, new TimeSpan(15, 0, 0), new TimeSpan(16, 30, 0))
        };

        foreach (var (clsIdx, rmIdx, day, start, end) in scheduleData)
        {
            var schedule = new Schedule
            {
                ClassId = classList[clsIdx].Id,
                RoomId = roomList[rmIdx].Id,
                DayOfWeek = day,
                StartTime = start,
                EndTime = end
            };
            context.Schedules.Add(schedule);
        }

        // 11. Seed 10 Realistic Enrollments
        var enrollmentList = new List<Enrollment>();
        for (int i = 0; i < 10; i++)
        {
            var course = courseList[i];
            var student = studentList[i];
            var enrollment = new Enrollment
            {
                StudentId = student.Id,
                CourseId = course.Id,
                TuitionAmount = course.TuitionFee,
                EnrollmentDate = new DateTime(2026, 9, 1).AddDays(i),
                Status = EnrollmentStatus.Enrolled,
                ConfirmedBy = adminId,
                ConfirmedAt = DateTime.UtcNow.AddDays(-20 + i)
            };
            context.Enrollments.Add(enrollment);
            enrollmentList.Add(enrollment);
        }

        // 12. Seed 10 Realistic Sections
        var sectionList = new List<Section>();
        var sectionData = new[]
        {
            ("Unit 1: Greetings, Introductions & Personal Identity", "Xây dựng sự tự tin trong giao tiếp ban đầu, giới thiệu nghề nghiệp và sở thích."),
            ("Unit 2: Daily Routines, Habits & Lifestyle Management", "Mô tả sinh hoạt hàng ngày, lịch trình làm việc và thói quen giải trí lành mạnh."),
            ("Unit 3: Work, Career Advancement & Workplace Communication", "Ngôn ngữ công sở, giao tiếp qua email, trao đổi với đồng nghiệp và báo cáo công việc."),
            ("Unit 4: Travel, Global Cultures & City Navigation", "Hỏi đường, đặt phòng khách sạn, giao tiếp tại sân bay và khám phá văn hóa thế giới."),
            ("Unit 5: Food, Culinary Experiences & Dining Out", "Gọi món tại nhà hàng, miêu tả hương vị ẩm thực và phong tục ăn uống quốc tế."),
            ("Unit 6: Technology, Digital Media & Artificial Intelligence", "Thảo luận về tác động của công nghệ, mạng xã hội và trí tuệ nhân tạo trong cuộc sống."),
            ("Unit 7: Health, Mental Well-being & Physical Fitness", "Từ vựng về sức khỏe, lối sống lành mạnh, chăm sóc thể chất và tinh thần."),
            ("Unit 8: Academic Data Interpretation & Trend Analysis", "Chiến lược phân tích biểu đồ, bảng biểu và xu hướng tăng giảm trong học thuật."),
            ("Unit 9: Critical Thinking, Debate & Argumentation Skills", "Xây dựng luận điểm logic, phản biện ý kiến đối lập và bảo vệ quan điểm cá nhân."),
            ("Unit 10: Public Speaking, Pitching & Fluency Strategies", "Kỹ năng làm chủ sân khấu, kiểm soát giọng nói, body language và truyền cảm hứng.")
        };

        for (int i = 0; i < 10; i++)
        {
            var (title, desc) = sectionData[i];
            var section = new Section
            {
                CourseId = courseList[i].Id,
                Title = title,
                Description = desc,
                OrderIndex = 1
            };
            context.Sections.Add(section);
            sectionList.Add(section);
        }

        await context.SaveChangesAsync();

        // 13. Seed 10 Realistic ClassStudents
        for (int i = 0; i < 10; i++)
        {
            var classStudent = new ClassStudent
            {
                ClassId = classList[i].Id,
                StudentId = studentList[i].Id,
                EnrollmentId = enrollmentList[i].Id,
                JoinedAt = new DateTime(2026, 9, 1).AddDays(i),
                Status = ClassStudentStatus.Active
            };
            context.ClassStudents.Add(classStudent);
        }

        // 14. Seed 10 Realistic Payments
        var paymentMethods = new[]
        {
            PaymentMethod.BankTransfer,
            PaymentMethod.BankTransfer,
            PaymentMethod.Cash,
            PaymentMethod.Online,
            PaymentMethod.BankTransfer,
            PaymentMethod.Cash,
            PaymentMethod.BankTransfer,
            PaymentMethod.Online,
            PaymentMethod.Cash,
            PaymentMethod.BankTransfer
        };

        for (int i = 0; i < 10; i++)
        {
            var enr = enrollmentList[i];
            var payment = new Payment
            {
                EnrollmentId = enr.Id,
                Amount = enr.TuitionAmount,
                PaymentDate = enr.EnrollmentDate.AddDays(1),
                PaymentMethod = paymentMethods[i],
                TransactionCode = $"TXN{20260901001 + i}",
                Status = PaymentStatus.Completed,
                Note = $"Đã hoàn tất thanh toán học phí khóa {courseList[i].CourseCode}"
            };
            context.Payments.Add(payment);
        }

        // 15. Seed 10 Realistic Lessons
        var lessonData = new[]
        {
            ("Bài 1.1: IPA Chart & English Phonetics Foundations", "Tổng quan về 44 âm IPA, cách đặt lưỡi và lấy hơi chuẩn xác.", "https://youtu.be/sample-ipa-lesson"),
            ("Bài 2.1: Simple Present & Adverbs of Frequency in Daily Life", "Cấu trúc thì Hiện tại đơn và các trạng từ chỉ tần suất trong giao tiếp sinh hoạt.", "https://youtu.be/sample-present-simple"),
            ("Bài 3.1: Professional Email Writing Etiquette & Phrases", "Mẫu câu chuẩn trong soạn thảo email xin việc, báo cáo tiến độ và gửi đối tác.", "https://youtu.be/sample-business-email"),
            ("Bài 4.1: Essential Travel Vocabulary & Flight Boarding Guide", "Các tình huống thủ tục hải quan, hành lý và xử lý sự cố khi đi máy bay quốc tế.", "https://youtu.be/sample-travel-english"),
            ("Bài 5.1: Ordering at a Restaurant & Dietary Preferences", "Cách đặt bàn, gọi món ăn, hỏi về thành phần dị ứng và thanh toán hóa đơn.", "https://youtu.be/sample-dining-english"),
            ("Bài 6.1: Tech Slang & Conversational AI Discussion", "Thuật ngữ công nghệ thông dụng và cách tranh luận về tương lai của AI.", "https://youtu.be/sample-tech-english"),
            ("Bài 7.1: Talking About Symptoms & Medical Consultation", "Giao tiếp với bác sĩ khi đi khám bệnh, mô tả triệu chứng và hiểu đơn thuốc.", "https://youtu.be/sample-health-english"),
            ("Bài 8.1: Describing Line Graphs & Pie Charts in Academic Contexts", "Từ vựng miêu tả xu hướng biến động: soar, plunge, fluctuate, level off.", "https://youtu.be/sample-chart-writing"),
            ("Bài 9.1: Structuring a Cohesive 4-Paragraph Opinion Essay", "Cách viết Introduction cuốn hút, triển khai 2 Body paragraphs và kết luận đúc kết.", "https://youtu.be/sample-essay-structure"),
            ("Bài 10.1: Master Your Presentation Hook & Storytelling", "Nghệ thuật mở đầu bài nói ấn tượng và kết nối cảm xúc với khán giả.", "https://youtu.be/sample-presentation-skills")
        };

        for (int i = 0; i < 10; i++)
        {
            var (title, content, video) = lessonData[i];
            var lesson = new Lesson
            {
                SectionId = sectionList[i].Id,
                Title = title,
                Content = content,
                VideoUrl = video,
                OrderIndex = 1,
                Status = LessonStatus.Published
            };
            context.Lessons.Add(lesson);
        }

        // 16. Seed 10 Realistic AttendanceSessions
        var sessionList = new List<AttendanceSession>();
        for (int i = 0; i < 10; i++)
        {
            var cls = classList[i];
            var session = new AttendanceSession
            {
                ClassId = cls.Id,
                SessionDate = new DateTime(2026, 9, 15).AddDays(i * 2),
                StartTime = new TimeSpan(18, 0, 0),
                CreatedBy = cls.TeacherId ?? teacherList[0].Id
            };
            context.AttendanceSessions.Add(session);
            sessionList.Add(session);
        }

        // 17. Seed 10 Realistic Assignments
        var assignmentList = new List<Assignment>();
        var assignmentData = new[]
        {
            ("IELTS Writing Task 1: Academic Bar Chart Report", "Phân tích biểu đồ tiêu thụ năng lượng tái tạo tại 5 quốc gia châu Âu (tối thiểu 150 từ).", 10.0m),
            ("IELTS Writing Task 2: Opinion Essay on Artificial Intelligence", "Viết bài luận học thuật thảo luận về tác động của AI đối với thị trường việc làm tương lai (tối thiểu 250 từ).", 10.0m),
            ("Speaking Audio: 2-minute Self Introduction & Career Vision", "Ghi âm bài nói 2 phút giới thiệu bản thân, chuyên ngành và định hướng nghề nghiệp 5 năm tới.", 10.0m),
            ("Business English: Professional Client Inconvenience Apology Email", "Soạn email gửi khách hàng giải thích sự cố giao hàng chậm trễ và đưa ra phương án đền bù thỏa đáng.", 10.0m),
            ("TOEIC Reading Part 7: Comprehensive Practice Set 01", "Hoàn thành và giải thích đáp án cho 15 câu hỏi đọc hiểu văn bản thương mại đính kèm.", 10.0m),
            ("Pronunciation Audio: Sentence Stress and Intonation Patterns", "Luyện đọc và nộp file âm thanh 10 câu phức với ngữ điệu lên xuống tự nhiên theo chuẩn IPA.", 10.0m),
            ("Grammar Worksheet: Mixed Conditionals in Real Life Contexts", "Hoàn thành bài tập chuyển đổi 20 câu điều kiện hỗn hợp loại 2 và 3.", 10.0m),
            ("Academic Vocabulary Log: 30 Collocations with Examples", "Lập bảng tổng hợp 30 collocations học thuật thuộc chủ đề Environment & Education kèm câu ví dụ.", 10.0m),
            ("Listening Comprehension: TED Talk Summary & Reflection", "Nghe bài thuyết trình TED Talk 'The Power of Vulnerability' và viết tóm tắt 200 từ.", 10.0m),
            ("Final Presentation Pitch: Innovative Startup Idea Slide Deck", "Nộp slide thuyết trình nhóm giới thiệu một giải pháp công nghệ xanh và kịch bản phân công thuyết trình.", 10.0m)
        };

        for (int i = 0; i < 10; i++)
        {
            var (title, desc, maxScore) = assignmentData[i];
            var cls = classList[i];
            var teacherId = cls.TeacherId ?? teacherList[0].Id;
            var assignment = new Assignment
            {
                ClassId = cls.Id,
                TeacherId = teacherId,
                Title = title,
                Description = desc,
                Deadline = DateTime.UtcNow.AddDays(7 + i),
                MaxScore = maxScore,
                Status = AssignmentStatus.Published
            };
            context.Assignments.Add(assignment);
            assignmentList.Add(assignment);
        }

        // 18. Seed 10 Realistic Quizzes
        var quizList = new List<Quiz>();
        var quizData = new[]
        {
            ("Kiểm Tra Định Kỳ Unit 1: Từ Vựng & Thì Hiện Tại Đơn", 30, 2),
            ("Đánh Giá Năng Lực Phát Âm & Phản Xạ Giao Tiếp A1", 20, 1),
            ("Kiểm Tra Ngữ Pháp Unit 2: Trạng Từ Tần Suất & Giới Từ", 30, 2),
            ("IELTS Mock Test: Mini Listening & Reading Practice", 45, 1),
            ("TOEIC Part 5 Mini Test: Incomplete Sentences Practice", 30, 2),
            ("Kiểm Tra Giữa Kỳ: Đọc Hiểu & Giao Tiếp Thương Mại B1", 45, 1),
            ("Kiểm Tra Từ Vựng Chuyên Ngành Kinh Doanh & Đàm Phán", 25, 2),
            ("Kiểm Tra Ngữ Pháp Nâng Cao: Mệnh Đề Quan Hệ & Câu Bị Động", 30, 1),
            ("IELTS Academic Reading: Short Passage Comprehension", 40, 1),
            ("Kiểm Tra Tổng Kết Khóa Học: Đánh Giá Toàn Diện 4 Kỹ Năng", 60, 1)
        };

        for (int i = 0; i < 10; i++)
        {
            var (title, duration, attempts) = quizData[i];
            var quiz = new Quiz
            {
                ClassId = classList[i].Id,
                Title = title,
                Description = $"Bài kiểm tra đánh giá năng lực thực tế dành cho học viên lớp {classList[i].ClassCode}.",
                DurationMinutes = duration,
                MaxAttempts = attempts,
                StartAt = DateTime.UtcNow.AddDays(-10),
                EndAt = DateTime.UtcNow.AddDays(20),
                Status = QuizStatus.Published
            };
            context.Quizzes.Add(quiz);
            quizList.Add(quiz);
        }

        await context.SaveChangesAsync();

        // 19. Seed AttendanceRecords, Submissions, Questions & Options
        for (int i = 0; i < 10; i++)
        {
            var session = sessionList[i];
            var stu = studentList[i];
            var status = i % 7 == 0 ? AttendanceStatus.Late : AttendanceStatus.Present;
            var record = new AttendanceRecord
            {
                AttendanceSessionId = session.Id,
                StudentId = stu.Id,
                Status = status,
                Note = status == AttendanceStatus.Late ? "Đến muộn 10 phút do kẹt xe" : "Tham gia đầy đủ và tích cực phát biểu"
            };
            context.AttendanceRecords.Add(record);
        }

        var submissionFeedback = new[]
        {
            (8.5m, "Bài viết tốt, bố cục chặt chẽ. Cần chú ý thêm sự đa dạng của từ vựng chỉ xu hướng tăng giảm."),
            (9.0m, "Ý tưởng xuất sắc, luận điểm rõ ràng và lập luận logic. Sử dụng vốn từ học thuật phong phú."),
            (8.0m, "Phát âm tròn vành rõ chữ, ngữ điệu tự nhiên. Cần chú ý nối âm 's' ở các danh từ số nhiều."),
            (8.5m, "Email viết rất chuyên nghiệp, văn phong lịch sự và giải pháp đưa ra thuyết phục."),
            (9.5m, "Đọc hiểu chính xác và phân tích ngữ cảnh tốt. Thời gian làm bài rất nhanh."),
            (8.0m, "Ngữ điệu câu hỏi rất tốt. Cần nhấn mạnh hơn vào từ khóa quan trọng trong câu khẳng định."),
            (9.0m, "Nắm chắc cấu trúc câu điều kiện hỗn hợp. Rất ít lỗi ngữ pháp nhỏ."),
            (8.5m, "Các ví dụ minh họa tự nhiên và sát với ngữ cảnh thực tế. Tiếp tục phát huy."),
            (9.0m, "Tóm tắt súc tích, nắm bắt trọn vẹn thông điệp cốt lõi của diễn giả TED Talk."),
            (9.5m, "Slide thiết kế đẹp, nội dung sáng tạo và cấu trúc thuyết trình rất thuyết phục.")
        };

        for (int i = 0; i < 10; i++)
        {
            var (score, feedback) = submissionFeedback[i];
            var submission = new Submission
            {
                AssignmentId = assignmentList[i].Id,
                StudentId = studentList[i].Id,
                Content = $"Nội dung bài nộp của học viên {studentList[i].StudentCode} cho bài tập: {assignmentList[i].Title}",
                SubmittedAt = DateTime.UtcNow.AddDays(-2),
                Score = score,
                Feedback = feedback
            };
            context.Submissions.Add(submission);
        }

        var sampleQuestions = new[]
        {
            ("Choose the sentence that is grammatically CORRECT:", QuestionType.MultipleChoice, 2.5m, new[]
            {
                ("She go to the library every Monday morning.", false),
                ("She goes to the library every Monday morning.", true),
                ("She going to the library every Monday morning.", false),
                ("She is go to the library every Monday morning.", false)
            }),
            ("In English, the word 'photograph' has the primary stress on the first syllable.", QuestionType.TrueFalse, 2.5m, new[]
            {
                ("True", true),
                ("False", false)
            }),
            ("Fill in the blank: The meeting has been postponed ______ next Friday due to unexpected circumstances.", QuestionType.MultipleChoice, 2.5m, new[]
            {
                ("until", true),
                ("at", false),
                ("since", false),
                ("during", false)
            }),
            ("Choose the correct synonym for 'meticulous':", QuestionType.MultipleChoice, 2.5m, new[]
            {
                ("careful and detailed", true),
                ("careless and quick", false),
                ("friendly and open", false),
                ("boring and repetitive", false)
            })
        };

        foreach (var qz in quizList)
        {
            for (int qIdx = 0; qIdx < sampleQuestions.Length; qIdx++)
            {
                var (content, type, score, options) = sampleQuestions[qIdx];
                var question = new Question
                {
                    QuizId = qz.Id,
                    Content = $"Câu {qIdx + 1}: {content}",
                    QuestionType = type,
                    Score = score,
                    OrderIndex = qIdx + 1
                };

                foreach (var (optText, isCorrect) in options)
                {
                    question.QuestionOptions.Add(new QuestionOption
                    {
                        Content = optText,
                        IsCorrect = isCorrect,
                        OrderIndex = question.QuestionOptions.Count + 1
                    });
                }
                context.Questions.Add(question);
            }
        }
        await context.SaveChangesAsync();

        for (int i = 0; i < 10; i++)
        {
            var qz = quizList[i];
            var stu = studentList[i];
            var attempt = new QuizAttempt
            {
                QuizId = qz.Id,
                StudentId = stu.Id,
                AttemptNumber = 1,
                StartedAt = DateTime.UtcNow.AddDays(-3),
                SubmittedAt = DateTime.UtcNow.AddDays(-3).AddMinutes(25),
                Score = 10.0m,
                Status = QuizAttemptStatus.Submitted
            };

            var questions = await context.Questions.Include(q => q.QuestionOptions).Where(q => q.QuizId == qz.Id).ToListAsync();
            foreach (var q in questions)
            {
                var correctOpt = q.QuestionOptions.FirstOrDefault(o => o.IsCorrect);
                attempt.QuizAnswers.Add(new QuizAnswer
                {
                    QuestionId = q.Id,
                    SelectedOptionId = correctOpt?.Id,
                    IsCorrect = true,
                    ScoreEarned = q.Score
                });
            }

            context.QuizAttempts.Add(attempt);
        }
        await context.SaveChangesAsync();

        // 20. Seed 10 Realistic Grades
        for (int i = 0; i < 10; i++)
        {
            var cls = classList[i];
            var stu = studentList[i];
            var grade = new Grade
            {
                ClassId = cls.Id,
                StudentId = stu.Id,
                AttendanceScore = 9.5m,
                AssignmentScore = 8.5m,
                QuizScore = 9.0m,
                MidtermScore = 8.8m,
                FinalScore = 9.2m,
                TotalScore = 9.0m
            };
            context.Grades.Add(grade);
        }

        // 21. Seed 10 Realistic Notifications
        var notificationData = new[]
        {
            ("Chào mừng học viên mới đến với kỳ học Mùa Thu 2026", "Trung tâm tiếng Anh trân trọng chào đón toàn thể học viên. Chúc các bạn có một hành trình học tập đầy cảm hứng và đạt được mục tiêu chứng chỉ mong muốn."),
            ("Thông báo lịch nghỉ lễ Quốc Khánh và kế hoạch học bù", "Trung tâm xin thông báo lịch nghỉ lễ và kế hoạch học bù chi tiết cho các lớp buổi tối. Học viên vui lòng kiểm tra thời khóa biểu cập nhật."),
            ("Nhắc nhở hạn nộp bài tập Writing Task 2 lớp IELTS Intensive", "Nhắc nhở học viên lớp CLS-IELTS-01 hoàn thành bài luận phân tích AI và nộp bài trên hệ thống trước 23:59 Chủ Nhật tuần này."),
            ("Kết quả kiểm tra giữa kỳ đã được cập nhật trên cổng học viên", "Điểm số và nhận xét chi tiết của giảng viên đã sẵn sàng trong mục Bảng điểm. Học viên vui lòng truy cập để theo dõi tiến độ của mình."),
            ("Hội thảo trực tuyến: 'Chiến thuật chinh phục IELTS 7.5+' cùng chuyên gia", "Thứ Bảy tuần này, trung tâm tổ chức buổi workshop độc quyền chia sẻ kinh nghiệm xử lý Speaking Part 3 và Writing Task 2 cùng ThS. Đặng Thị Kim Ngân."),
            ("Thông báo cập nhật phòng học và cơ sở vật chất mới", "Từ tuần tới, các lớp luyện thi kỹ năng nghe sẽ được chuyển sang Phòng Lab Đa Phương Tiện A với trang thiết bị tai nghe chống ồn chuyên dụng."),
            ("Lời nhắc hoàn tất học phí các khóa học quý IV/2026", "Học viên đăng ký khóa học mới vui lòng hoàn tất học phí trước ngày khai giảng để được hưởng ưu đãi 10% học phí và nhận bộ tài liệu độc quyền."),
            ("Sinh hoạt Câu lạc bộ tiếng Anh English Speaking Club cuối tuần", "Chủ đề tuần này: 'Sustainable Living & Global Citizenship'. Tham gia miễn phí cho toàn bộ học viên trung tâm tại sảnh Hội Thảo Hall A."),
            ("Hướng dẫn sử dụng hệ thống thi Quiz và nộp bài tập trực tuyến", "Tài liệu chi tiết hướng dẫn học viên cách tham gia làm bài trắc nghiệm thời gian thực và đính kèm file bài tập Speaking."),
            ("Khảo sát lấy ý kiến học viên về chất lượng giảng dạy tháng 10/2026", "Ý kiến đóng góp quý báu của bạn giúp trung tâm không ngừng nâng cao chất lượng dịch vụ đào tạo. Vui lòng dành 3 phút hoàn thành phiếu khảo sát.")
        };

        for (int i = 0; i < 10; i++)
        {
            var (title, content) = notificationData[i];
            var notif = new Notification
            {
                Title = title,
                Content = content,
                SenderId = adminId,
                ReceiverId = studentList[i].User.Id,
                ClassId = classList[i].Id,
                CreatedAt = DateTime.UtcNow.AddDays(-10 + i),
                IsRead = i % 2 == 0,
                ReadAt = i % 2 == 0 ? DateTime.UtcNow.AddDays(-10 + i).AddHours(3) : null
            };
            context.Notifications.Add(notif);
        }

        await context.SaveChangesAsync();
    }
}
