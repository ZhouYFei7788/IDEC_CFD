# **针对Climaveneta TECS2/SL-CA-E 0853-S磁悬浮冷水机组的深度技术剖析与控制逻辑CFD仿真建模报告**

## **1\. 绪论：磁悬浮离心技术在现代制冷系统中的演进与仿真需求**

在当今的高效暖通空调（HVAC）领域，Climaveneta（克莱门特）TECS2/SL-CA-E 0853-S 机组代表了制冷技术的顶峰，其核心在于将无油磁悬浮离心压缩机技术与满液式蒸发器及闪蒸罐经济器循环的深度集成。本报告旨在为计算流体力学（CFD）仿真专家提供一份详尽的物理与逻辑蓝图，从而在数字孪生环境中精确复现该机组在稳态及瞬态下的热流体行为。

传统的容积式压缩机（如螺杆或涡旋）依赖于油润滑系统，这不仅增加了系统的复杂性，还在换热器表面形成了热阻油膜，降低了全生命周期的能效。TECS2系列采用的Danfoss Turbocor磁悬浮压缩机彻底消除了润滑油的需求，通过磁性轴承实现转子的无接触悬浮，不仅消除了机械摩擦损耗，更使得满液式蒸发器的传热模型得以简化——无需考虑润滑油在制冷剂中的溶解度及其对沸腾传热系数的衰减影响 1。

对于CFD仿真而言，TECS2/SL-CA-E 0853-S 的复杂性不在于其静态几何结构，而在于其高度动态的控制逻辑。W3000TE控制器与EKS电子膨胀阀驱动器协同工作，通过实时调节压缩机转速、入口导叶（IGV）角度以及多路电子膨胀阀的开度，来维持热力学平衡并防止喘振。本报告将深入剖析Drawing No. F370853EYCOS-O系统原理图中的每一个组件，揭示其背后的控制策略，并将这些物理行为转化为CFD软件（如ANSYS Fluent、STAR-CCM+或OpenFOAM）所需的边界条件方程和源项定义。

## **2\. 系统热力学架构与组件拓扑深度解析**

TECS2/SL-CA-E 0853-S 的制冷剂回路设计是基于带中间补气的两级压缩循环。为了在仿真中构建准确的流体域，必须首先理解其拓扑结构及其在不同压力级之间的质量与能量传递机制。

### **2.1 机组命名规则与技术规格界定**

根据技术文档，型号**TECS2/SL-CA-E 0853-S** 包含了决定仿真参数的关键信息：

* **TECS2**：第二代高效离心系统平台，确立了系统的基本控制响应特性的基准。  
* **SL (Super Low Noise)**：超低噪音版本。这在CFD建模中意味着冷凝器风扇的流场边界条件（流量与压头）受到声学设计的限制，通常表现为较低的迎面风速和加装的压缩机隔音罩对散热的影响 1。  
* **CA (Class A Efficiency)**：A级能效。这暗示了换热器面积的冗余设计，意味着在CFD多孔介质模型中，管束的传热系数设置需处于较高水平。  
* **E**：高效增强型，通常配备EC风扇和优化的经济器回路。  
* **0853**：标称制冷量约为850 kW。该机组通常配置为双回路或三回路系统，具体取决于压缩机数量（通常为3台压缩机分布在2个回路中，或者类似的非对称配置）3。  
* **S**：标准壳管式换热器配置。

### **2.2 制冷剂回路拓扑详析（基于原理图F370853EYCOS-O）**

依据提供的系统原理图 4，该机组的流体网络可以被数学化分解为三个主要的压力节点：高压（冷凝压力 $P\_c$）、中压（中间喷气压力 $P\_m$）和低压（蒸发压力 $P\_e$）。

#### **2.2.1 高压侧：冷凝与排气动力学**

压缩机（C）排出的高温高压过热蒸汽首先经过止回阀组件（VR4, VR5P）。在CFD模拟中，这些止回阀不应被简化为简单的阻力元件，而应被视为具有迟滞特性的单向流边界。

* **防逆流机制**：磁悬浮压缩机在停机后，由于缺乏机械摩擦，转子会因高低压差驱动而发生反转。VR4/VR5P的物理存在是为了切断这一回流路径。在瞬态停机模拟中，必须编写UDF（用户自定义函数）来监测流向，一旦检测到反向速度矢量，即刻将动量源项设为无穷大阻力 5。  
* **冷凝器（BC）**：图纸显示为翅片管式（Fin & Coil）。在空气侧CFD模拟中，需将其处理为具有特定惯性阻力系数和粘性阻力系数的多孔介质区域。

#### **2.2.2 中压侧：闪蒸罐经济器（ECO）的物理特性**

与板式换热器经济器不同，图纸中明确标注的“ECO”配合“Injection”服务阀（R12-R16）以及专用的膨胀阀（TE3, TE4），表明这是一个\*\*闪蒸罐（Flash Tank）\*\*系统 4。

* **物理过程**：高压液态制冷剂通过TE3/TE4膨胀至中间压力。在闪蒸罐内，制冷剂分离为饱和液体和饱和气体。  
* **气相路径**：饱和蒸汽通过电磁阀（ES）和注入阀（R12-R16）直接引入压缩机的二级叶轮入口。这在热力学上降低了二级压缩的入口温度，从而减少了压缩功。  
* **液相路径**：分离出的饱和液体（温度低于冷凝温度）沉积在罐底，随后流向主膨胀阀（TE1/TE2）。  
* **CFD建模难点**：闪蒸罐内部涉及剧烈的相变和两相分离。若采用VOF（流体体积函数）模型，需极其细密的网格以捕捉气液界面。对于系统级仿真，建议采用混合模型（Mixture Model），并基于亨利定律或自定义的闪蒸速率方程来定义相间质量传递源项。

#### **2.2.3 低压侧：满液式蒸发器（EVA）**

原理图中的EVA被定义为满液式蒸发器。这意味着制冷剂在壳侧沸腾，而载冷剂（水）在管内流动 7。

* **液位动态**：制冷剂液位必须覆盖管束以保证换热效率，但又不能过高以防液击。图纸中显示的传感器S1（入口）和S2（出口）是安装在水路上的温度传感器 4，而非制冷剂液位传感器。制冷剂液位的控制依赖于复杂的推算逻辑或未在图例中详述的液位传感器（如导波雷达或电容式），但在Climaveneta的高端机组中，通常结合过热度与液位开关进行控制。

#### **2.2.4 防喘振旁通回路（Anti-Surge Loop）**

这是磁悬浮机组稳定运行的“生命线”。原理图展示了一条从压缩机排气口引出，经过维修阀（RB1）、防喘振电子膨胀阀（TE5）和止回阀（VRB），最终回到压缩机吸气口的管路 4。

* **功能定义**：当压缩机运行工况点逼近喘振线（Surge Line）时，TE5开启，将高压气体旁通回吸气口，人为增加流经叶轮的体积流量，从而使工况点右移至安全区域。  
* **热力学惩罚**：旁通的是高温气体，这会升高吸气温度，降低制冷剂密度，虽然解决了喘振，但严重降低了COP。CFD仿真必须能捕捉这一过程中的温度混合分层现象。

## ---

**3\. 磁悬浮离心压缩机动力学与控制图谱**

TECS2/SL-CA-E 0853-S 的核心动力源是Danfoss Turbocor压缩机（推测为TT系列或TG系列，取决于制冷剂是R134a还是R1234ze）2。理解其运行图谱（Compressor Map）是建立高保真仿真模型的前提。

### **3.1 压缩机特性方程与图谱重建**

离心压缩机的性能由压比（$\\Pi$）与校正质量流量（$\\dot{m}\_{corr}$）的关系定义，受转速（$N$）和入口导叶角度（$\\alpha$）的约束。

#### **3.1.1 压比方程**

在CFD的动量源项中，压缩机提供的压升 $\\Delta P$ 是流量的非线性函数：

$$\\Pi \= \\frac{P\_{dis}}{P\_{suc}} \= f(\\dot{m}, N, \\alpha)$$

通常采用多项式拟合来描述这一曲面：

$$\\Pi(N, \\dot{m}) \= C\_1 N^2 \+ C\_2 \\dot{m} N \+ C\_3 \\dot{m}^2 \+ C\_4$$

其中 $C\_1...C\_4$ 是基于压缩机Map数据的拟合系数。对于Turbocor压缩机，其Map具有宽广的运行范围，但在低流量高压比区域存在明确的物理边界——喘振线 10。

#### **3.1.2 喘振线（Surge Line）的数学描述**

喘振线定义了稳定运行的左边界。在W3000TE控制器中，这条线通常表示为：

$$\\dot{m}\_{surge} \= k\_1 \\cdot \\Pi^2 \+ k\_2 \\cdot \\Pi \+ k\_3$$

或者在 $(N, \\Pi)$ 坐标系中定义最小稳定转速。在CFD仿真中，必须编写代码实时监测当前工况点 $(\\dot{m}\_{curr}, \\Pi\_{curr})$ 与喘振线 $\\dot{m}\_{surge}(\\Pi\_{curr})$ 的距离。

### **3.2 变频驱动与转速控制逻辑**

W3000TE控制器通过PID算法调节压缩机转速以维持出水温度（LWT）11。

* **控制目标**：$T\_{LWT} \\rightarrow T\_{setpoint}$  
* 传递函数：

  $$N\_{cmd} \= K\_p \\cdot e(t) \+ K\_i \\int e(t) dt \+ K\_d \\frac{de(t)}{dt}$$

  其中 $e(t) \= T\_{LWT} \- T\_{setpoint}$。  
* **软启动逻辑**：为了维持磁悬浮轴承的稳定性，转速的变化率（$dN/dt$）受到严格限制（例如 $\\le 500 \\text{ RPM/s}$）。在瞬态CFD仿真中，入口流量边界条件的更新必须遵循这一斜率限制，不能发生阶跃跳变。

### **3.3 入口导叶（IGV）的协同控制**

IGV主要在低负荷下介入。当转速降至最低稳定转速（受限于磁轴承刚度或电机冷却需求）时，控制器开始关闭IGV以引入预旋（Pre-swirl）。

* **气动效应**：关闭IGV改变了进入一级叶轮的气流攻角，降低了压缩机的流量系数，从而使喘振线向左下方移动，扩大了低负荷运行范围 12。  
* **仿真实现**：在CFD中，可以通过改变压缩机入口面的切向速度分量来模拟IGV的作用，或者直接调整压缩机特性曲线的参数。

## ---

**4\. 核心控制逻辑深度剖析与仿真策略**

TECS2/SL-CA-E 0853-S 的“大脑”是W3000TE控制器，它指挥着EKS驱动器和所有执行机构。对于CFD仿真平台，不仅仅是模拟流体流动，更是要模拟这套“神经系统”的反应。以下是各个子系统的详细控制逻辑。

### **4.1 防喘振控制逻辑（TE5阀）的算法复现**

这是CFD仿真中最具挑战性的部分，因为喘振涉及流体的不稳定性。Climaveneta采用了基于“喘振裕度”（Surge Margin）的控制策略 13。

#### **4.1.1 喘振裕度计算**

控制器实时计算工作点与喘振线的距离。定义无量纲参数 $S$：

$$S \= \\frac{Q\_{actual}}{Q\_{surge\\\_limit}(P\_{ratio})}$$

其中 $Q$ 为吸气体积流量。为了安全，控制器设定了一条“喘振控制线”（Surge Control Line, SCL），通常设定在 $S \= 1.1$ （即10%的安全裕度）。

#### **4.1.2 PID控制环路**

TE5阀的开度（$Op\_{TE5}$）由以下逻辑驱动：

* **正常区域 ($S \> 1.1$)**：$Op\_{TE5} \= 0$（关闭）。  
* 控制区域 ($1.0 \< S \< 1.1$)：进入PI控制模式。

  $$Op\_{TE5} \= K\_p \\cdot (1.1 \- S) \+ K\_i \\int (1.1 \- S) dt$$

  此过程试图通过微量旁通来维持 $S$ 在1.1以上。  
* **紧急区域 ($S \< 1.0$)**：触发“快速响应”（Open Loop Step）。TE5阀瞬间开启至100%，以迅速降低排气压力并增加吸气流量，防止压缩机进入深度喘振循环 15。

**CFD仿真UDF代码逻辑示例**：

C

real P\_dis \= Get\_Average\_Pressure(Discharge\_Outlet);  
real P\_suc \= Get\_Average\_Pressure(Suction\_Inlet);  
real MassFlow \= Get\_MassFlow(Suction\_Inlet);  
real Pratio \= P\_dis / P\_suc;  
real MassFlow\_Surge \= A\*Pratio\*Pratio \+ B\*Pratio \+ C; // 多项式拟合喘振线

if (MassFlow \< 1.1 \* MassFlow\_Surge) {  
    // 激活旁通逻辑  
    real valve\_Cv \= Calculate\_Valve\_Opening(MassFlow, MassFlow\_Surge);  
    // 在CFD中更新TE5旁通入口的质量流量源项  
    Set\_Source\_Term(TE5\_Inlet, valve\_Cv \* sqrt(P\_dis \- P\_suc));  
}

### **4.2 闪蒸罐经济器（ECO）控制逻辑**

ECO的控制目标是维持闪蒸罐内的液位，确保进入压缩机中间级的全是气体，进入蒸发器的全是液体。这由TE3/TE4阀门管理 6。

#### **4.2.1 液位控制PID**

尽管原理图中未显示液位传感器符号，但高端机组通常配备磁致伸缩或电容式液位计（连接至EKS驱动器的输入端）。

* **目标变量**：闪蒸罐液位 $L\_{eco}$。  
* **执行机构**：TE3/TE4（高压侧膨胀阀）。  
* **逻辑**：  
  * 若 $L\_{eco} \< L\_{set}$：开大TE3/TE4，增加从冷凝器来的进液量。  
  * 若 $L\_{eco} \> L\_{set}$：关小TE3/TE4，防止液位过高导致带液进入中间级压缩（这对高速旋转的叶轮是致命的）。

#### **4.2.2 喷气压力优化**

除了液位，控制器还需维持最佳中间压力 $P\_m$ 以最大化COP。理论最佳中间压力为 $P\_m \= \\sqrt{P\_c \\cdot P\_e}$。W3000TE可能会微调TE3/TE4的开度，在满足液位约束的前提下，使罐内压力接近该几何平均值 17。在CFD中，这意味着闪蒸罐的压力场是动态变化的，而非固定边界。

### **4.3 满液式蒸发器过热度与液位控制（TE1/TE2）**

满液式蒸发器的控制比干式更为复杂，因为它必须同时管理液位和过热度。由于满液式设计中传热管完全浸没，出口过热度通常极低（\< 1K），直接用过热度控制膨胀阀会导致不亦动 7。

#### **4.3.1 复合控制策略**

Climaveneta采用了液位优先、过热度保护的策略：

1. **液位控制主环**：通过电子液位传感器反馈，调节TE1/TE2开度维持壳体内制冷剂液位覆盖管束上沿。  
2. **排气过热度修正**：由于吸气过热度极小且难以测量（易受液滴夹带干扰），控制器转而监测**排气过热度**（Discharge Superheat）。若排气过热度过低，表明吸气带液，控制器会强制关小TE1/TE2，覆盖液位信号 18。

#### **4.3.2 电子膨胀阀（EKS）的微步驱动**

EKS驱动器将控制信号转换为双极步进电机的脉冲。TE1/TE2阀门通常具有数千步的调节精度。在仿真中，阀门的流量特性曲线（$C\_v$ vs. Step）应被建模为非线性函数，而非简单的线性开启。

## ---

**5\. 用于CFD仿真平台的模型构建指南**

为了在数字环境中复现上述物理和逻辑行为，本节提供具体的建模参数和设置建议。

### **5.1 几何模型处理与网格划分**

* **计算域分解**：由于尺度差异巨大，建议将系统分解为三个子域进行协同仿真（Co-simulation）或集总参数耦合：  
  1. **蒸发器域**：重点关注管束间沸腾。网格需加密管壁边界层（$y+ \< 1$），使用欧拉多相流模型（Eulerian Multiphase）模拟气泡生成。  
  2. **闪蒸罐域**：重点关注气液分离效率。网格需捕捉自由液面（VOF模型），重点检查吸气口附近的液滴夹带率。  
  3. **压缩机域**：由于叶轮旋转极快，需使用滑移网格（Sliding Mesh）或MRF（多重参考系）模型。重点加密叶顶间隙，以准确预测泄漏流和喘振先兆。

### **5.2 边界条件设置（基于R134a工质）**

* **物性参数**：使用NIST RefProp数据库导入R134a的真实气体状态方程（Real Gas EOS），而非理想气体定律。这对于捕捉临界点附近的物性变化至关重要。

| 参数 | R134a数值 (典型工况) | 备注 |
| :---- | :---- | :---- |
| 液体密度 | \~1180 kg/m³ | @ 25°C |
| 气体密度 | \~14 kg/m³ | @ 3.5 bar (蒸发侧) |
| 表面张力 | 0.008 N/m | 影响沸腾气泡脱离直径 |
| 汽化潜热 | \~215 kJ/kg | 蒸发器源项核心数据 |

* **入口边界（蒸发器水侧）**：速度入口（Velocity Inlet），基于传感器S1的温度反馈。  
* **入口边界（制冷剂侧）**：质量流量入口（Mass Flow Inlet），数值由EKS控制逻辑UDF实时计算得出。  
* **出口边界**：压力出口（Pressure Outlet），设定为冷凝压力，但需叠加管路压降模型。

### **5.3 用户自定义函数（UDF）架构**

为了实现控制逻辑与物理场的耦合，必须编写UDF挂载到求解器。建议架构如下：

1. **DEFINE\_ADJUST**: 在每个时间步开始时执行。  
   * 读取 $P\_{suc}, P\_{dis}, T\_{water\\\_out}, Level\_{eco}$ 等传感器数据。  
   * 调用PID算法子程序，计算 $N\_{target}, \\theta\_{IGV}, Pos\_{TE1}, Pos\_{TE5}$。  
   * 计算当前时间步的阀门流量系数 $C\_v$ 和压缩机源项。  
2. **DEFINE\_SOURCE**: 将计算出的压缩机压升作为动量源项添加到流体域；将闪蒸和沸腾作为质量/能量源项添加到相方程。  
3. **DEFINE\_PROFILE**: 更新入口边界的质量流量（模拟膨胀阀动作）。

### **5.4 瞬态仿真设置建议**

* **时间步长**：压缩机域需极小步长（$10^{-5}$ s）以解析叶片通过频率；系统级热瞬态可用较大步长（$0.1 \- 0.01$ s）。建议采用多时间尺度耦合策略。  
* **收敛标准**：对于防喘振逻辑验证，必须监测压力波动的残差，不能仅看平均值。

## ---

**6\. 制冷工质的替代性分析：R134a vs. R1234ze**

虽然原理图标注适用于R134a，但Climaveneta TECS2系列也常用于HFO-1234ze(E) 19。在仿真中若需切换工质，需注意以下物理差异及其对控制逻辑的影响。

### **6.1 物理性质差异及其仿真修正**

| 特性 | R134a | R1234ze(E) | CFD仿真修正策略 |
| :---- | :---- | :---- | :---- |
| **分子量** | 102.03 | 114.04 | R1234ze分子量大，声速低。相同几何下，R1234ze的马赫数更高，更早遇到激波阻塞（Choke）。**必须调整压缩机Map的阻塞边界**。 |
| **体积制冷量** | 基准 | 低约25% | 达到相同冷量需增加30%的体积流量。**需增大阀门Cv值设置，否则仿真会出现节流效应** 20。 |
| **GWP** | 1430 | \< 1 | 对物理仿真无影响。 |
| **压力等级** | 基准 | 略低 | 蒸发和冷凝压力的边界条件需相应下调（约20%）。 |

### **6.2 对控制逻辑的潜在影响**

使用R1234ze时，由于其临界温度较高（109°C vs 101°C），在高温工况下效率衰减较慢。然而，由于其密度较低，防喘振阀TE5在相同开度下的质量流量泄放能力会下降。

* **逻辑调整**：在仿真R1234ze模型时，防喘振PID参数（$K\_p, K\_i$）需要增强，或者TE5阀门的尺寸需要在模型中放大，以提供足够的喘振保护裕度。

## ---

**7\. 结论与建议**

本报告通过对Climaveneta TECS2/SL-CA-E 0853-S机组的深入解构，建立了一套完整的技术分析框架。对于CFD仿真团队而言，成功的关键在于不仅仅模拟“冷机”的静态物理场，而是构建一个包含“W3000TE控制器逻辑 \+ EKS执行器动态 \+ Turbocor压缩机图谱 \+ 多相流热力学”的耦合系统。

**关键建议总结**：

1. **控制逻辑UDF化**：必须将防喘振逻辑（TE5）和液位控制逻辑（TE1-4）编写为UDF，否则无法捕捉机组在部分负荷下的真实响应。  
2. **闪蒸罐网格细化**：ECO的网格划分需足以解析气液分离，否则会错误预测液滴进入中间级，导致计算出的压缩机效率虚低。  
3. **软启动边界**：压缩机转速边界条件必须包含斜率限制，以模拟磁悬浮轴承的保护机制。  
4. **工质物性精度**：鉴于磁悬浮机组对压差极其敏感，必须使用NIST RefProp级别的高精度真实气体模型。

通过遵循本报告提供的逻辑框架和参数设定，仿真平台将能够准确预测该机组在极端工况（如冷却水温突变、低负荷喘振边缘）下的动态行为，为系统的优化设计和故障诊断提供强有力的数字支撑。

#### **引用的著作**

1. TECS2 0211 \- 1154 | MEHITS \- Mitsubishi Electric Hydronics & IT Cooling Systems S.p.A, 访问时间为 一月 4, 2026， [https://www.melcohit.com/en/products/1583/high-efficiency-chiller-air-source-for-outdoor-installation](https://www.melcohit.com/en/products/1583/high-efficiency-chiller-air-source-for-outdoor-installation)  
2. Air-cooled Oil-free Centrifugal Chiller \- Mitsubishi Electric Asia, 访问时间为 一月 4, 2026， [https://www.mitsubishielectric.com.sg/getattachment/ccdca8ae-28f5-4a3f-b5ed-b832df46bd19/TECS2-Air-cooled-Oil-free-Centrifugal-Chiller-B114-CCU01-01-2019-EN-SH.pdf](https://www.mitsubishielectric.com.sg/getattachment/ccdca8ae-28f5-4a3f-b5ed-b832df46bd19/TECS2-Air-cooled-Oil-free-Centrifugal-Chiller-B114-CCU01-01-2019-EN-SH.pdf)  
3. TECS2 / SL-CA, 访问时间为 一月 4, 2026， [https://apac.nl/wp-content/uploads/2019/06/Technische-details-TECS2\_APAC.pdf](https://apac.nl/wp-content/uploads/2019/06/Technische-details-TECS2_APAC.pdf)  
4. TECS2-SL-CA-E 0853-S 系统原理图.pdf  
5. TT 400, Applications Manual \- EN | PDF | Cable | Fuse (Electrical) \- Scribd, 访问时间为 一月 4, 2026， [https://www.scribd.com/document/328367109/TT-400-Applications-Manual-EN](https://www.scribd.com/document/328367109/TT-400-Applications-Manual-EN)  
6. US9657978B2 \- Refrigerant control system for a flash tank \- Google Patents, 访问时间为 一月 4, 2026， [https://patents.google.com/patent/US9657978B2/en](https://patents.google.com/patent/US9657978B2/en)  
7. Liquid Level Detection and Control of Flooded Evaporators \- Haiding Cooling and Heating, 访问时间为 一月 4, 2026， [https://www.haidinggroup.com/industry-news/liquid-level-detection-and-control-of-flooded-evaporators-article-257/](https://www.haidinggroup.com/industry-news/liquid-level-detection-and-control-of-flooded-evaporators-article-257/)  
8. Brazed Plate Heat Exchanger | MEHITS \- Climaveneta Climate Technologies, 访问时间为 一月 4, 2026， [https://in.climaveneta.com/en/stories/461/brazed-plate-heat-exchanger](https://in.climaveneta.com/en/stories/461/brazed-plate-heat-exchanger)  
9. TTS centrifugal compressors | Efficient chillers \- Danfoss, 访问时间为 一月 4, 2026， [https://www.danfoss.com/en-us/products/dcs/compressors/turbocor/turbocor-tt/](https://www.danfoss.com/en-us/products/dcs/compressors/turbocor/turbocor-tt/)  
10. A review of anti-surge control systems of compressors and advanced fault-tolerant control techniques for integration perspective \- NIH, 访问时间为 一月 4, 2026， [https://pmc.ncbi.nlm.nih.gov/articles/PMC10480680/](https://pmc.ncbi.nlm.nih.gov/articles/PMC10480680/)  
11. W3000 Controller User Manual \- Studylib, 访问时间为 一月 4, 2026， [https://studylib.net/doc/27517750/user-manual-w3000-te](https://studylib.net/doc/27517750/user-manual-w3000-te)  
12. Performance Analysis of a Two-Stage Refrigeration Centrifugal Compressor With Variable Inlet Guide Vanes on Both Stages, 访问时间为 一月 4, 2026， [https://docs.lib.purdue.edu/cgi/viewcontent.cgi?article=2369\&context=icec](https://docs.lib.purdue.edu/cgi/viewcontent.cgi?article=2369&context=icec)  
13. Anti-surge Controllers in Compressor Control Systems \- Petrotech, Inc., 访问时间为 一月 4, 2026， [https://petrotechinc.com/the-role-of-anti-surge-controllers-in-compressor-control-systems/](https://petrotechinc.com/the-role-of-anti-surge-controllers-in-compressor-control-systems/)  
14. Compressor Anti-Surge Controls \- Strategic Automation Services, 访问时间为 一月 4, 2026， [https://sas-web.com/compressor-anti-surge-controls/](https://sas-web.com/compressor-anti-surge-controls/)  
15. What is an anti-surge valve and what are their functions? \- AutomationForum, 访问时间为 一月 4, 2026， [https://automationforum.co/what-is-an-anti-surge-valve-and-what-are-their-functions/](https://automationforum.co/what-is-an-anti-surge-valve-and-what-are-their-functions/)  
16. EKE 347 liquid level controllers | Industrial refrigeration \- Danfoss, 访问时间为 一月 4, 2026， [https://www.danfoss.com/en-us/products/dcs/electronic-controls/electronic-valve-control-eke-347/](https://www.danfoss.com/en-us/products/dcs/electronic-controls/electronic-valve-control-eke-347/)  
17. Optimizing Performance of Refrigeration System with Flash Tank Economizer, 访问时间为 一月 4, 2026， [https://www.jmcampbell.com/tip-of-the-month/2017/12/optimizing-performance-of-refrigeration-system-with-flash-tank-economizer/](https://www.jmcampbell.com/tip-of-the-month/2017/12/optimizing-performance-of-refrigeration-system-with-flash-tank-economizer/)  
18. Expansion Valve Hunting \- Technique Learning Solutions, 访问时间为 一月 4, 2026， [https://learntechnique.com/expansion-valve-hunting/](https://learntechnique.com/expansion-valve-hunting/)  
19. TECS2-W HFO 0351 \- 1414 | MEHITS, 访问时间为 一月 4, 2026， [https://www.climaveneta.com/en/products/1600/high-efficiency-water-cooled-chiller](https://www.climaveneta.com/en/products/1600/high-efficiency-water-cooled-chiller)  
20. Comparison of R134a and R1234ze for New Chiller Systems and for Fluid (Drop-In) in Existing Systems \- Concepts NREC, 访问时间为 一月 4, 2026， [https://www.conceptsnrec.com/hubfs/Tech\_Papers/Comparison%20of%20R134a%20and%20R1234ze%20for%20New%20Chiller%20Systems%20and%20for%20Fluid%20(Drop-In)%20in%20Existing%20Systems.pdf](https://www.conceptsnrec.com/hubfs/Tech_Papers/Comparison%20of%20R134a%20and%20R1234ze%20for%20New%20Chiller%20Systems%20and%20for%20Fluid%20\(Drop-In\)%20in%20Existing%20Systems.pdf)